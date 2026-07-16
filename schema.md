-- ============================================
-- NOVEL PLATFORM DATABASE SCHEMA (Supabase/PostgreSQL)
-- ============================================

-- 1. admin
CREATE TABLE admin (
    admin_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. users
-- "user" is a reserved word in Postgres, hence the plural table name
CREATE TABLE users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    profile_image VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. author
CREATE TABLE author (
    author_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    pen_name VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    bio TEXT,
    profile_image VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. category
CREATE TABLE category (
    category_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- 5. novel
CREATE TABLE novel (
    novel_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    novel_name VARCHAR(255) NOT NULL UNIQUE,
    author_id BIGINT NOT NULL REFERENCES author(author_id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES category(category_id) ON DELETE SET NULL,
    synopsis TEXT,
    cover_image VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ongoing',
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. chapter
CREATE TABLE chapter (
    chapter_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    novel_id BIGINT NOT NULL REFERENCES novel(novel_id) ON DELETE CASCADE,
    chapter_no INT NOT NULL,
    chapter_title VARCHAR(255) NOT NULL,
    content TEXT,
    view_count INT DEFAULT 0,
    published_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (novel_id, chapter_no)
);

-- 7. comment
CREATE TABLE comment (
    comment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    chapter_id BIGINT NOT NULL REFERENCES chapter(chapter_id) ON DELETE CASCADE,
    parent_comment_id BIGINT REFERENCES comment(comment_id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    is_spoiler BOOLEAN DEFAULT FALSE,
    comment_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'visible'
);

-- 8. favorite
CREATE TABLE favorite (
    favorite_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    novel_id BIGINT NOT NULL REFERENCES novel(novel_id) ON DELETE CASCADE,
    added_date TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, novel_id)
);

-- 9. reading_history
CREATE TABLE reading_history (
    history_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    chapter_id BIGINT NOT NULL REFERENCES chapter(chapter_id) ON DELETE CASCADE,
    read_date TIMESTAMP DEFAULT NOW()
);

-- 10. visit_log — source of truth for all reports
CREATE TABLE visit_log (
    visit_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    novel_id BIGINT REFERENCES novel(novel_id) ON DELETE SET NULL,
    chapter_id BIGINT REFERENCES chapter(chapter_id) ON DELETE SET NULL,
    visit_date TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR(45)
);

-- ============================================
-- INDEXES for report performance
-- ============================================
CREATE INDEX idx_visit_log_date ON visit_log (visit_date);
CREATE INDEX idx_visit_log_novel ON visit_log (novel_id);
CREATE INDEX idx_novel_author ON novel (author_id);
CREATE INDEX idx_novel_category ON novel (category_id);
CREATE INDEX idx_chapter_novel ON chapter (novel_id);
CREATE INDEX idx_comment_chapter ON comment (chapter_id);