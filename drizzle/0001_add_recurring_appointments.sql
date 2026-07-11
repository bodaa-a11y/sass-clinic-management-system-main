-- Add recurring appointment fields
ALTER TABLE "appointments" ADD COLUMN "is_recurring" boolean DEFAULT false NOT NULL;
ALTER TABLE "appointments" ADD COLUMN "recurring_pattern" varchar(20);
ALTER TABLE "appointments" ADD COLUMN "recurring_count" integer;
ALTER TABLE "appointments" ADD COLUMN "recurring_end_date" date;
ALTER TABLE "appointments" ADD COLUMN "parent_appointment_id" uuid;
