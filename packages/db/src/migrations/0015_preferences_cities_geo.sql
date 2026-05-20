-- Story 1.8 follow-up : géoréférencer les villes préférées pour appliquer
-- le rayon en km dans le deck (haversine).
--
-- Format : [{"label": "Paris", "lat": 48.8566, "lng": 2.3522}, ...].

ALTER TABLE "preferences" ADD COLUMN "cities_geo" jsonb DEFAULT '[]'::jsonb NOT NULL;
