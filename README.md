Guillaume's notes:

- have a provider hotswap that looks at the response time and swaps provider accordingly (say after 5s - notify user - swap)


# Create T3 App
This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.


EASIEST (Low hanging fruit):
Loading states during sign-in/chat creation
Error handling for failed auth/chat operations

MODERATE (Some complexity but straightforward):

Email/password login
Dark/light theme toggle
Delete individual chats

HARDER (Requires database changes & significant logic):

Associate chats with specific users
User-specific chat history
Load previous chats on lobby
Rename/edit chat titles

____

**DONE**
Chat UI:
- Add to watch list chip is green
- Show notification after movie was added to watch list (Toaster)


**DONE** Side bar:
- change name
- Link for watch list and watch history
- only display 10 chats
- display timestamp (date)

___

Make custom tools:

Return to stream text

Chain optional tool for media look up

and then onFinish we do an llm all for media chips

Media look up:
- when you recommend a movie, do a media look up on TMDB using Search / Multi - then we need to filter that by keeping the exact title match and most popular

We want a different LLM call just dedicated to conversational chips with granular prompt guidance for the kind of chips we want

___

**DONE** UI:
make chat wider
have 3 sections (see sketch)

Make movie posters clickable:
- add to watch list
- add to history
- "say more" - question mark symbol?
- maybe a thumbs up or down

Chips:
- contextual conversational chips (bring them back)
- make custom API call for that (onFinish?)

Watch history:
- create it
- add logic similar to addToWatchlist

Chat names:
- come up with solution

Chat history:
- display 10 most recents
- add button to see all history

Data persistence:
- switch from local storage to Supabase

Auth:
- add sign up form for email

Overal UI character:
- Colors
- themed animation
- logo?

