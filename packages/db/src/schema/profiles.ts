import { pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { createId } from '../lib/id.js';
import { timestamps } from '../lib/timestamps.js';
import { users } from './users.js';

export const profiles = pgTable(
  'profiles',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    firstName: text('first_name'),
    lastName: text('last_name'),
    phone: text('phone'),
    city: text('city'),
    bio: text('bio'),
    ...timestamps,
  },
  (table) => [uniqueIndex('idx_profiles_user_id').on(table.userId)],
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
