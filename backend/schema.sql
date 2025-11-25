---------------------------------------------------------
-- USERS
---------------------------------------------------------

CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar TEXT,
    bio TEXT,
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


---------------------------------------------------------
-- SUBTHREADS (COMMUNITIES)
---------------------------------------------------------

CREATE TABLE public.subthreads (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    rules TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    logo TEXT,
    banner_url TEXT,
    created_by INTEGER REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL
);


---------------------------------------------------------
-- POSTS
---------------------------------------------------------

CREATE TABLE public.posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    subthread_id INTEGER NOT NULL REFERENCES public.subthreads(id) ON UPDATE CASCADE ON DELETE CASCADE,
    title TEXT NOT NULL,
    media TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_edited BOOLEAN DEFAULT FALSE
);


---------------------------------------------------------
-- COMMENTS
---------------------------------------------------------

CREATE TABLE public.comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    parent_id INTEGER REFERENCES public.comments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    has_parent BOOLEAN,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_edited BOOLEAN DEFAULT FALSE
);


---------------------------------------------------------
-- REACTIONS (UPVOTE/DOWNVOTE)
---------------------------------------------------------

CREATE TABLE public.reactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    post_id INTEGER REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    comment_id INTEGER REFERENCES public.comments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    is_upvote BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, post_id),
    UNIQUE (user_id, comment_id)
);


---------------------------------------------------------
-- SAVED POSTS
---------------------------------------------------------

CREATE TABLE public.saved (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, post_id)
);


---------------------------------------------------------
-- SUBSCRIPTIONS (COMMUNITY MEMBERS)
---------------------------------------------------------

CREATE TABLE public.subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    subthread_id INTEGER NOT NULL REFERENCES public.subthreads(id) ON UPDATE CASCADE ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, subthread_id)
);


---------------------------------------------------------
-- ROLES (mod/admin)
---------------------------------------------------------

CREATE TABLE public.roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE
);


---------------------------------------------------------
-- USER ROLES (mod/admin assignments)
---------------------------------------------------------

CREATE TABLE public.user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE,
    subthread_id INTEGER REFERENCES public.subthreads(id) ON UPDATE CASCADE ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, role_id, subthread_id)
);


---------------------------------------------------------
-- MESSAGES (PRIVATE MESSAGES)
---------------------------------------------------------

CREATE TABLE public.messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    seen BOOLEAN NOT NULL DEFAULT FALSE,
    seen_at TIMESTAMP WITH TIME ZONE
);


---------------------------------------------------------
-- TRIGGER FOR UPDATED_AT IN SUBTHREADS
---------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subthreads_updated_at
    BEFORE UPDATE ON public.subthreads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


---------------------------------------------------------
-- VIEWS
---------------------------------------------------------

-- POST INFO VIEW
CREATE OR REPLACE VIEW public.post_info AS
SELECT
    t.id AS thread_id,
    t.name AS thread_name,
    t.logo AS thread_logo,
    p.id AS post_id,
    k.karma AS post_karma,
    p.title,
    p.media,
    p.is_edited,
    p.content,
    p.created_at,
    u.id AS user_id,
    u.username AS user_name,
    u.avatar AS user_avatar,
    c.comments_count
FROM public.posts p
JOIN (
    SELECT p.id AS post_id,
           COALESCE(SUM(
              CASE WHEN r.is_upvote THEN 1
                   WHEN r.is_upvote = FALSE THEN -1
                   ELSE 0 END
           ), 0) AS karma
    FROM public.posts p
    LEFT JOIN public.reactions r ON r.post_id = p.id
    GROUP BY p.id
) k ON k.post_id = p.id
JOIN (
    SELECT p.id AS post_id, COUNT(c.id) AS comments_count
    FROM public.posts p
    LEFT JOIN public.comments c ON c.post_id = p.id
    GROUP BY p.id
) c ON c.post_id = p.id
JOIN public.subthreads t ON t.id = p.subthread_id
JOIN public.users u ON u.id = p.user_id;


-- SUBTHREAD INFO VIEW
CREATE OR REPLACE VIEW public.subthread_info AS
SELECT
    s.id,
    s.name,
    s.logo,
    m.members_count,
    p.posts_count,
    c.comments_count
FROM public.subthreads s
LEFT JOIN (
    SELECT subthread_id, COUNT(*) AS members_count
    FROM public.subscriptions
    GROUP BY subthread_id
) m ON m.subthread_id = s.id
LEFT JOIN (
    SELECT subthread_id, COUNT(*) AS posts_count
    FROM public.posts
    GROUP BY subthread_id
) p ON p.subthread_id = s.id
LEFT JOIN (
    SELECT posts.subthread_id, COUNT(comments.id) AS comments_count
    FROM public.posts
    LEFT JOIN public.comments ON comments.post_id = posts.id
    GROUP BY posts.subthread_id
) c ON c.subthread_id = s.id;


-- COMMENT INFO VIEW
CREATE OR REPLACE VIEW public.comment_info AS
SELECT
    c.id AS comment_id,
    u.username AS user_name,
    u.avatar AS user_avatar,
    ckarma.comment_karma,
    c.has_parent,
    c.parent_id,
    c.is_edited,
    c.content,
    c.created_at,
    p.id AS post_id
FROM public.comments c
LEFT JOIN (
    SELECT c.id AS comment_id,
           COALESCE(SUM(
               CASE WHEN r.is_upvote THEN 1
                    WHEN r.is_upvote = FALSE THEN -1
                    ELSE 0 END
           ), 0) AS comment_karma
    FROM public.comments c
    LEFT JOIN public.reactions r ON r.comment_id = c.id
    GROUP BY c.id
) ckarma ON ckarma.comment_id = c.id
LEFT JOIN public.users u ON u.id = c.user_id
LEFT JOIN public.posts p ON p.id = c.post_id;


-- USER INFO VIEW
CREATE OR REPLACE VIEW public.user_info AS
SELECT
    u.id AS user_id,
    (c.karma + p.karma) AS user_karma,
    c.comments_count,
    c.karma AS comments_karma,
    p.posts_count,
    p.karma AS posts_karma
FROM public.users u
LEFT JOIN (
    SELECT u.id AS user_id,
           COUNT(c.id) AS comments_count,
           COALESCE(SUM(
               CASE WHEN r.is_upvote AND r.comment_id IS NOT NULL THEN 1
                    WHEN NOT r.is_upvote AND r.comment_id IS NOT NULL THEN -1
                    ELSE 0 END
           ), 0) AS karma
    FROM public.users u
    LEFT JOIN public.comments c ON c.user_id = u.id
    LEFT JOIN public.reactions r ON r.comment_id = c.id
    GROUP BY u.id
) c ON c.user_id = u.id
LEFT JOIN (
    SELECT u.id AS user_id,
           COUNT(p.id) AS posts_count,
           COALESCE(SUM(
               CASE WHEN r.is_upvote AND r.post_id IS NOT NULL THEN 1
                    WHEN NOT r.is_upvote AND r.post_id IS NOT NULL THEN -1
                    ELSE 0 END
           ), 0) AS karma
    FROM public.users u
    LEFT JOIN public.posts p ON p.user_id = u.id
    LEFT JOIN public.reactions r ON r.post_id = p.id
    GROUP BY u.id
) p ON p.user_id = u.id;


---------------------------------------------------------
-- DEFAULT ROLE SEED DATA
---------------------------------------------------------

INSERT INTO roles (name, slug)
VALUES
    ('Thread Moderator', 'mod'),
    ('Administrator', 'admin')
ON CONFLICT DO NOTHING;


---------------------------------------------------------
-- REPORTS (Post Reporting System)
---------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reports (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    reporter_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_post_id ON public.reports(post_id);


---------------------------------------------------------
-- DELETION HISTORY (Moderation Audit Log)
---------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.deletion_history (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL,
    deleted_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    reason TEXT,
    original_title TEXT,
    original_content TEXT,
    original_media TEXT,
    original_author_id INTEGER,
    original_author_username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    report_id INTEGER
);

CREATE INDEX IF NOT EXISTS idx_deletion_history_deleted_at ON public.deletion_history(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deletion_history_post_id ON public.deletion_history(post_id);

---------------------------------------------------------
-- CHAT HISTORY (AI Assistant Chat History)
---------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.chat_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45), -- IPv6 max length
    query TEXT NOT NULL,
    answer TEXT NOT NULL,
    sources JSONB, -- Store sources as JSON
    is_political BOOLEAN DEFAULT FALSE,
    response_time_ms FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON public.chat_history(created_at);
