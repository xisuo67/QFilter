CREATE TABLE IF NOT EXISTS model_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    api_url TEXT NOT NULL,
    model_name TEXT NOT NULL,
    api_key TEXT NOT NULL
);

