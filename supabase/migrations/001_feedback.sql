CREATE TABLE IF NOT EXISTS rm_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  nota_radioleg TEXT NOT NULL,
  anestesia TEXT,
  ia_protocol_n INTEGER,
  ia_nom_protocol TEXT,
  ia_torn TEXT,
  ia_equip1 TEXT,
  ia_equips TEXT,
  ia_contrast TEXT,
  ia_bomba TEXT,
  ia_conf TEXT,
  ia_why TEXT,
  decisio TEXT NOT NULL,
  correccio_protocol_n INTEGER,
  correccio_nom_protocol TEXT,
  correccio_torn TEXT,
  correccio_equip1 TEXT,
  correccio_comment TEXT
);
ALTER TABLE rm_feedback DISABLE ROW LEVEL SECURITY;
