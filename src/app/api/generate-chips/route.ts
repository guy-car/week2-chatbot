import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Update the interface to include conversation context
interface ChipRequest {
    lastUserMessage: string;
    lastAssistantMessage: string;
    recommendedMovies?: Array<{ title: string; release_date?: string }>;
    conversationContext?: Array<{ role: string; content: string }>;
}

const chipsSchema = z.object({
    chips: z.array(z.object({
        text: z.string(),
        type: z.enum([
            'broaden', 'deepen', 'curveball', 'reset', 'educational',
            'tone_shift', 'philosophical', 'nostalgic', 'style', 'meta',
            'similar_but_different', 'hidden_gem', 'completion'
        ])
    }))
});

export async function POST(req: Request) {
    const body = await req.json() as ChipRequest;
    const { lastUserMessage, lastAssistantMessage, recommendedMovies, conversationContext } = body;

    // Detect if there's been a topic change
    const hasTopicChanged = conversationContext && conversationContext.length >= 2 &&
        conversationContext[conversationContext.length - 2]?.role === 'user';

    const recentContext = conversationContext
        ? conversationContext.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')
        : '';

    const chipGenerationPrompt = `You are Watch Genie, a witty and insightful film recommendation assistant. Your role is to help users keep exploring new movie directions — especially when they're not sure what to watch. Think like a friend who knows hidden gems and remembers that one perfect scene from a movie you mentioned three years ago.

${hasTopicChanged ? 'IMPORTANT: The user has just changed topics. Generate chips relevant to the NEW topic, not the previous conversation.' : ''}

You've just seen:
* The **user's message** about what they're in the mood for
* The **assistant's response**, which includes 1–3 specific movie suggestions
* Optionally, metadata about those movies (genre, director, year, etc.)
* An evolving profile of the user's known tastes

**Recent conversation context:**
${recentContext}

Now your job is to generate up to **5 contextual "exploration chips"** — clickable UI elements that help the user keep going.

**Important constraints:**
* Do **not** repeat or rephrase the movie recommendations
* Each chip must be **short** (max 7 words), natural, and clickable as a follow-up
* Avoid ellipses, emojis, or redundant suggestions
* Avoid genre labels unless necessary
* Focus on ideas, moods, creators, questions, or tonal shifts
* Channel the *Watch Genie* personality: playful, insightful, surprising, and truly attuned to the user
${hasTopicChanged ? '* CRITICAL: Focus ONLY on the current topic. Ignore previous topics from the conversation.' : ''}

Chips may serve different purposes. Here are the **chip types** (include the type label with each chip):
* \`broaden\`: a parallel suggestion path or nearby theme
* \`deepen\`: something more specific or intense within the current theme
* \`curveball\`: a surprising but smart tonal shift
* \`reset\`: for when nothing hits; suggest a new angle
* \`educational\`: explore creators, studios, styles, or background info
* \`tone_shift\`: reorient by mood ("lighter," "darker," "more hopeful")
* \`philosophical\`: explore deep ideas hinted at in the request
* \`nostalgic\`: past films, eras, or visuals connected by memory
* \`style\`: explore a visual or storytelling style
* \`meta\`: user-shaping chip, like "add this to my vibe"
* \`similar_but_different\`: "Like X but with Y twist"
* \`hidden_gem\`: lesser-known films that fit the vibe
* \`completion\`: for series/franchises ("Watch the trilogy")

Only include chips that make sense for this specific situation — it's okay to return just 2 or 3.

Order chips by relevance/likelihood of user interest, with the most compelling first.

If the conversation lacks clear direction, default to 1 curveball, 1 broaden, and 1 nostalgic option.

Return as a JSON array with this exact format:
[
  {"text": "chip text here", "type": "broaden"},
  {"text": "another suggestion", "type": "curveball"}
]`;

    const { object } = await generateObject({
        model: openai('gpt-4o-mini'),
        system: chipGenerationPrompt,
        prompt: `User said: "${lastUserMessage}"
    Assistant responded: "${lastAssistantMessage}"
    ${recommendedMovies && recommendedMovies.length > 0 ? `Movies recommended: ${recommendedMovies.map(m => m.title).join(', ')}` : ''}
    
    Generate contextual exploration chips:`,
        schema: chipsSchema,
        temperature: 0.8,
    });

    return Response.json({ chips: object.chips });
}