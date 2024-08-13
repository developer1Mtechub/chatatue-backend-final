CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_updated_at_trigger') THEN
    CREATE TRIGGER update_user_updated_at_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_category_updated_at') THEN
    CREATE TRIGGER update_category_updated_at
    BEFORE UPDATE ON category
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sub_category_updated_at') THEN
    CREATE TRIGGER update_sub_category_updated_at
    BEFORE UPDATE ON sub_category
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_running_experience_levels_updated_at') THEN
    CREATE TRIGGER update_running_experience_levels_updated_at
    BEFORE UPDATE ON running_experience_levels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_fitness_goals_updated_at') THEN
    CREATE TRIGGER update_fitness_goals_updated_at
    BEFORE UPDATE ON fitness_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_social_preferences_updated_at') THEN
    CREATE TRIGGER update_social_preferences_updated_at
    BEFORE UPDATE ON social_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_running_times_updated_at') THEN
    CREATE TRIGGER update_running_times_updated_at
    BEFORE UPDATE ON running_times
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_policies_updated_at') THEN
    CREATE TRIGGER update_policies_updated_at
    BEFORE UPDATE ON policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'club_updated_at') THEN
    CREATE TRIGGER club_updated_at
    BEFORE UPDATE ON club
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'routes_updated_at') THEN
    CREATE TRIGGER routes_updated_at
    BEFORE UPDATE ON routes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'waypoints_updated_at') THEN
    CREATE TRIGGER waypoints_updated_at
    BEFORE UPDATE ON waypoints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'club_members_updated_at') THEN
    CREATE TRIGGER club_members_updated_at
    BEFORE UPDATE ON club_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

END;
$$;
