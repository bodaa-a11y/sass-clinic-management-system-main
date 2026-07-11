-- Fix: Change availability_slots.doctor_id FK from staff to users
-- The system stores doctors in the users table, not the staff table

-- Step 1: Find and drop the existing FK constraint
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'availability_slots'
    AND kcu.column_name = 'doctor_id'
    AND tc.constraint_type = 'FOREIGN KEY';
    
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE availability_slots DROP CONSTRAINT ' || constraint_name;
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  ELSE
    RAISE NOTICE 'No FK constraint found on availability_slots.doctor_id';
  END IF;
END;
$$;

-- Step 2: Add new FK constraint pointing to users.id
ALTER TABLE availability_slots
  ADD CONSTRAINT availability_slots_doctor_id_fkey
  FOREIGN KEY (doctor_id) REFERENCES users(id);

-- Also fix other tables that may have same issue
-- doctor_leaves.doctor_id: change from staff to users
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'doctor_leaves'
    AND kcu.column_name = 'doctor_id'
    AND tc.constraint_type = 'FOREIGN KEY';
    
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE doctor_leaves DROP CONSTRAINT ' || constraint_name;
    ALTER TABLE doctor_leaves ADD CONSTRAINT doctor_leaves_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES users(id);
    RAISE NOTICE 'Fixed doctor_leaves.doctor_id FK constraint';
  END IF;
END;
$$;

-- schedule_exceptions.doctor_id: change from staff to users
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'schedule_exceptions'
    AND kcu.column_name = 'doctor_id'
    AND tc.constraint_type = 'FOREIGN KEY';
    
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE schedule_exceptions DROP CONSTRAINT ' || constraint_name;
    ALTER TABLE schedule_exceptions ADD CONSTRAINT schedule_exceptions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES users(id);
    RAISE NOTICE 'Fixed schedule_exceptions.doctor_id FK constraint';
  END IF;
END;
$$;

-- waitlist.doctor_id: change from staff to users
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'waitlist'
    AND kcu.column_name = 'doctor_id'
    AND tc.constraint_type = 'FOREIGN KEY';
    
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE waitlist DROP CONSTRAINT ' || constraint_name;
    ALTER TABLE waitlist ADD CONSTRAINT waitlist_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES users(id);
    RAISE NOTICE 'Fixed waitlist.doctor_id FK constraint';
  END IF;
END;
$$;
