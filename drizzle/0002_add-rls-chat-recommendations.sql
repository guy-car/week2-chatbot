-- drizzle-orm migration: add RLS and policy for chat_recommendations

ALTER TABLE public.chat_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own chat recommendations"
ON public.chat_recommendations FOR ALL
USING (
  (SELECT user_id FROM public.chats WHERE id = chat_id)
  = (SELECT current_setting('rls.user_id', true))
)
WITH CHECK (
  (SELECT user_id FROM public.chats WHERE id = chat_id)
  = (SELECT current_setting('rls.user_id', true))
);
