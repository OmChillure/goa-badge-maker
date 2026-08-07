DROP POLICY "Anyone can view cards" ON public.cards;
REVOKE SELECT ON public.cards FROM anon;
REVOKE SELECT, INSERT, UPDATE ON public.cards FROM authenticated;