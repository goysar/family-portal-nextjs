from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.db.session import SessionLocal

def create_superadmin():
    db = SessionLocal()
    try:
        superadmin = User(
            email="admin@family.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Super Admin",
            is_active=True,
            role=UserRole.SUPER_ADMIN
        )
        db.add(superadmin)
        db.commit()
        db.refresh(superadmin)
        print(f"Superadmin created with ID: {superadmin.id}")
    except Exception as e:
        print(f"Error creating superadmin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_superadmin()