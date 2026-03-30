CREATE TABLE IF NOT EXISTS offline_ocr_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    enabled INTEGER NOT NULL DEFAULT 0,
    selected_model_id TEXT
);

INSERT INTO offline_ocr_settings (id, enabled, selected_model_id)
VALUES (1, 0, NULL)
ON CONFLICT(id) DO NOTHING;

