-- Migration: Profilbild-Feld zur users-Tabelle hinzufügen
ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) NULL AFTER verified_trainer;
