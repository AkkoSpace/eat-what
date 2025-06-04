-- 创建用户表
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE,
    email TEXT UNIQUE,
    nickname TEXT,
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'USER',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户偏好表
CREATE TABLE user_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    today_blacklist TEXT NOT NULL DEFAULT '[]',
    permanent_blacklist TEXT NOT NULL DEFAULT '[]',
    last_active_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建食物表
CREATE TABLE foods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    image TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    is_user_uploaded BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    upload_ip TEXT,
    uploaded_by TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 创建上传限制表
CREATE TABLE upload_limits (
    ip TEXT PRIMARY KEY,
    upload_count INTEGER NOT NULL DEFAULT 0,
    last_upload_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建游客偏好表
CREATE TABLE guest_preferences (
    id TEXT PRIMARY KEY,
    device_fingerprint TEXT NOT NULL UNIQUE,
    today_blacklist TEXT NOT NULL DEFAULT '[]',
    permanent_blacklist TEXT NOT NULL DEFAULT '[]',
    last_active_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_foods_type ON foods(type);
CREATE INDEX idx_foods_status ON foods(status);
CREATE INDEX idx_foods_category ON foods(category);
CREATE INDEX idx_foods_created_at ON foods(created_at);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_guest_preferences_device_fingerprint ON guest_preferences(device_fingerprint);
