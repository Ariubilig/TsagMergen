-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ai_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  plan_date date NOT NULL,
  summary text,
  stress_load text,
  recommended_start_time time without time zone,
  ordered_tasks jsonb,
  ai_message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_plans_pkey PRIMARY KEY (id),
  CONSTRAINT ai_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.demo_users(user_id)
);
CREATE TABLE public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  grade integer NOT NULL,
  class_section text NOT NULL CHECK (class_section = ANY (ARRAY['A'::text, 'B'::text])),
  class_name text DEFAULT ((grade)::text || class_section),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT classes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.demo_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  password text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  class_id uuid NOT NULL,
  CONSTRAINT demo_users_pkey PRIMARY KEY (id),
  CONSTRAINT demo_users_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);
CREATE TABLE public.grade_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  grade_level integer NOT NULL,
  class_section text,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_type text,
  priority text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT grade_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.homework (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  subject text NOT NULL,
  title text NOT NULL,
  description text,
  assigned_date date,
  due_date date,
  difficulty text,
  estimated_minutes integer,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT homework_pkey PRIMARY KEY (id),
  CONSTRAINT homework_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.demo_users(user_id)
);
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_order integer NOT NULL,
  question_text text NOT NULL,
  category text NOT NULL,
  options jsonb,
  input_type text NOT NULL DEFAULT 'choice'::text,
  format text,
  CONSTRAINT questions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  day_of_week integer NOT NULL,
  period integer NOT NULL,
  subject text NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT schedules_pkey PRIMARY KEY (id),
  CONSTRAINT schedules_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  learning_style text,
  stress_level text,
  procrastination_risk text,
  reminder_tone text,
  raw_scores jsonb,
  study_start_time time without time zone,
  home_arrival_time time without time zone,
  sleep_time time without time zone,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.demo_users(user_id)
);