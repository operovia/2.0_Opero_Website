ALTER TABLE "console_scenes" ADD COLUMN "answer_table" jsonb;--> statement-breakpoint
ALTER TABLE "console_scenes" ADD COLUMN "follow_up" text DEFAULT '' NOT NULL;--> statement-breakpoint
-- The rent roll scene, added once to sites that already have scenes, at the
-- end of their list. A new site's first start adds it with the other seed
-- scenes instead (src/content/seed-scenes.ts), so this skips an empty table.
INSERT INTO "console_scenes" ("position", "question", "thinking_ms", "answer_tag", "answer_main", "answer_support", "answer_table", "follow_up")
SELECT
  COALESCE(MAX("position"), -1) + 1,
  'Show me the rent roll for Parkside Commons.',
  1400,
  'Parkside Commons · Rent roll',
  '4 tenants, fully leased',
  '16,600 RSF · $387,600 annual base rent',
  '{"columns":["Tenant","RSF","Annual rent","Term left"],"rows":[["Copperline Coffee","1,450","$39,150","4 yrs"],["Birchwood Therapy","3,800","$87,400","2 yrs"],["Northgate Insurance","5,200","$119,600","8 mos"],["Summit Engineering","6,150","$141,450","5 yrs"]]}'::jsonb,
  'Would you like me to export an Excel file?'
FROM "console_scenes"
HAVING COUNT(*) > 0;
