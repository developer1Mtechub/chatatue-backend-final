-- user table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT,
    profile_image JSONB,
    age NUMERIC CHECK (age >= 0),
    gender VARCHAR(255),
    bio VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone_number NUMERIC,
    password TEXT,
    otp TEXT,
    otp_expiry TIMESTAMP,
    block_status BOOLEAN DEFAULT FALSE,
    signup_type VARCHAR(255) DEFAULT 'EMAIL' CHECK (signup_type IN ('EMAIL', 'GOOGLE', 'APPLE')),
    google_access_token TEXT,
    apple_access_token TEXT,
    device_id TEXT,
    user_role VARCHAR(255) DEFAULT 'USER' CHECK (user_role IN ('USER', 'ADMIN')),
    account_delete_status BOOLEAN DEFAULT FALSE,
    account_delete_date TIMESTAMP,
    running_experience_level_id UUID,
    fitness_goal_ids UUID[] DEFAULT '{}',
    social_preferences_id UUID,
    running_time_id UUID,
    interest_ids UUID[] DEFAULT '{}',
    profile_showcase_photos JSONB DEFAULT '[]',
    lat NUMERIC,
    long NUMERIC,
    rating DECIMAL(3, 2) DEFAULT 3.00 CHECK (rating >= 1 AND rating <= 5),
    customer_id VARCHAR(255) UNIQUE,
    connected_account_id VARCHAR(255) UNIQUE,
    is_requirement_completed BOOLEAN DEFAULT FALSE,
    total_followers INT DEFAULT 0,
    total_following INT DEFAULT 0,
    goals_visible BOOLEAN DEFAULT true,
    interests_visible BOOLEAN DEFAULT true,
    showcase_visible BOOLEAN DEFAULT true,
    experience_level_visible BOOLEAN DEFAULT true,
    social_preferences_visible BOOLEAN DEFAULT true,
    social_media_links_visible BOOLEAN DEFAULT true,
    running_times_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS followers(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- the user who is following 
    followed_id UUID REFERENCES users(id) ON DELETE CASCADE, -- the user who is being followed
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS category (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    );
    
CREATE TABLE IF NOT EXISTS sub_category (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES category(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS running_experience_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    );
    
CREATE TABLE IF NOT EXISTS fitness_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS social_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    preference VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    );


    CREATE TABLE IF NOT EXISTS running_times (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time_interval VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS social_links(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform_name VARCHAR(255) NOT NULL,
    platform_link TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS club(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    images JSONB NOT NULL CHECK (jsonb_array_length(images) BETWEEN 1 AND 3),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    fee NUMERIC,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_ids UUID[] DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    club_id UUID REFERENCES club(id) ON DELETE CASCADE,
    start_loc_name VARCHAR NOT NULL,
    end_loc_name VARCHAR NOT NULL,
    start_lat NUMERIC NOT NULL,
    start_long NUMERIC NOT NULL,
    start_elevation NUMERIC NOT NULL,
    end_lat NUMERIC NOT NULL,
    end_long NUMERIC NOT NULL,
    end_elevation NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS waypoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    lat NUMERIC NOT NULL,
    long NUMERIC NOT NULL,
    elevation NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS club_rules(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES club(id) ON DELETE CASCADE,
    rule TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS club_fitness_goals(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES club(id) ON DELETE CASCADE,
    goal TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS club_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    club_id UUID REFERENCES club(id) ON DELETE CASCADE,
    status VARCHAR(255) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS club_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    club_id UUID REFERENCES club(id) ON DELETE CASCADE,
    member_role VARCHAR(255) DEFAULT 'MEMBER' CHECK (member_role IN ('MEMBER', 'ADMIN', 'CREATOR')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS club_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES club(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR,
    images JSONB NOT NULL CHECK (jsonb_array_length(images) BETWEEN 1 AND 5),
    description TEXT,
    tag VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS club_highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES club(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR,
    images JSONB NOT NULL CHECK (jsonb_array_length(images) BETWEEN 1 AND 5),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES club(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day VARCHAR NOT NULL,
    time_name VARCHAR NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES club(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR,
    images JSONB NOT NULL CHECK (jsonb_array_length(images) BETWEEN 1 AND 3),
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    amount NUMERIC,
    start_time TIMESTAMP NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    distance NUMERIC,
    location TEXT,
    rating DECIMAL(3, 2) DEFAULT 3.00 CHECK (rating >= 1 AND rating <= 5),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    route_ids UUID[],
    category_ids UUID[],
    badge_ids UUID[],
    event_link TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_members(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meeting_points(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location TEXT,
    lat NUMERIC,
    long NUMERIC,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cards(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id VARCHAR(255) REFERENCES users(customer_id) ON DELETE CASCADE,
    card_id TEXT,
    finger_print TEXT,
    exp_month NUMERIC,
    exp_year NUMERIC,
    lastDigit NUMERIC,
    brand_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    details JSONB,
    transaction_type VARCHAR(255) NOT NULL CHECK (transaction_type IN ('EVENT','WITHDRAWAL', 'MERCHANDISE')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS wallet(
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_balance NUMERIC,
  total_earning NUMERIC,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS upcoming_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    balance NUMERIC,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    badge_icon JSONB,
    badge_type VARCHAR(255) NOT NULL UNIQUE CHECK (badge_type IN ('SILVER', 'GOLD', 'PLATINUM' , 'PRIZE')),
    amount NUMERIC,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES club(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  sizes TEXT[] NOT NULL,
  materials TEXT NOT NULL,
  price DECIMAL(100, 2) NOT NULL,
  images JSONB NOT NULL CHECK (jsonb_array_length(images) BETWEEN 1 AND 10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  discount_code VARCHAR(50) NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('PERCENTAGE' , 'AMOUNT')), -- 'percentage' or 'amount'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(100, 2) NOT NULL,
    address VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'PENDING' CHECK (status IN ('PENDING' , 'CONFIRMED' , 'DELIEVERED')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policies(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(255) NOT NULL UNIQUE CHECK (type IN ('TERMS', 'PRIVACY')),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    reviewer_id UUID REFERENCES users(id),
    event_id UUID REFERENCES events(id),
    type VARCHAR NOT NULL CHECK (type IN ('EVENT' , 'PROFILE')),
    rating DECIMAL(3, 2) CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_anonymus BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rating_suggestions(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT  NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS notifications(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_queries(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR DEFAULT 'PENDING' CHECK (status IN ('PENDING' , 'CONTACTED' , 'DISMISSED')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faq (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id) NOT NULL,
    reported_id UUID REFERENCES users(id) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES club(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    recipient_id UUID REFERENCES users(id),
    type VARCHAR NOT NULL CHECK (type IN ('PRIVATE', 'CLUB', 'EVENT')),
    name VARCHAR(255) NOT NULL,
    image TEXT,
    deleted_by UUID[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id),
    recipient_id UUID REFERENCES users(id), -- Only for private messages
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    message_time TIME NOT NULL,
    deleted_by UUID[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    group_id UUID NOT NULL REFERENCES groups(id),
    role VARCHAR DEFAULT 'MEMBER' CHECK (role IN ('MEMBER', 'ADMIN', 'CREATOR')),
    joined_at TIMESTAMP DEFAULT NOW()
);


