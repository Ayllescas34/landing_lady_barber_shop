import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_appointments_cancelled_by" AS ENUM('business', 'client');
  ALTER TABLE "appointments" ADD COLUMN "cancelled_by" "enum_appointments_cancelled_by";
  ALTER TABLE "appointments" ADD COLUMN "manage_token" varchar;
  ALTER TABLE "appointments" ADD COLUMN "reminder_sent" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "appointments" DROP COLUMN "cancelled_by";
  ALTER TABLE "appointments" DROP COLUMN "manage_token";
  ALTER TABLE "appointments" DROP COLUMN "reminder_sent";
  DROP TYPE "public"."enum_appointments_cancelled_by";`)
}
