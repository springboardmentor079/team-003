import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.project import Project, ProjectMilestone, ProjectStatus, MilestoneStatus
from app.models.resource import Resource, ResourceType, ResourceStatus
from app.models.inventory import Inventory
from app.models.workforce import Worker, Attendance, AttendanceStatus
from app.models.procurement import Procurement, ProcurementStatus
from app.models.notification_report import Notification, Report, Document
from app.utils.security import get_password_hash

def seed_database():
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # Check if users exist
        if db.query(User).first():
            print("Database already contains data. Skipping seeding.")
            return

        print("Seeding BuildTrack database with realistic initial data...")

        # 1. Create Users
        admin = User(
            email="admin@buildtrack.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Alexander Vance (System Admin)",
            phone="+1-555-0101",
            role=UserRole.ADMINISTRATOR.value
        )
        manager = User(
            email="manager@buildtrack.com",
            hashed_password=get_password_hash("manager123"),
            full_name="Sarah Jenkins (Senior PM)",
            phone="+1-555-0102",
            role=UserRole.PROJECT_MANAGER.value
        )
        engineer = User(
            email="engineer@buildtrack.com",
            hashed_password=get_password_hash("engineer123"),
            full_name="David Miller (Lead Engineer)",
            phone="+1-555-0103",
            role=UserRole.SITE_ENGINEER.value
        )
        contractor = User(
            email="contractor@buildtrack.com",
            hashed_password=get_password_hash("contractor123"),
            full_name="Apex Construction Contractors Inc.",
            phone="+1-555-0104",
            role=UserRole.CONTRACTOR.value
        )
        client = User(
            email="client@buildtrack.com",
            hashed_password=get_password_hash("client123"),
            full_name="Global Tech Horizon Estates",
            phone="+1-555-0105",
            role=UserRole.CLIENT.value
        )

        db.add_all([admin, manager, engineer, contractor, client])
        db.commit()

        # Refresh to get IDs
        db.refresh(admin)
        db.refresh(manager)
        db.refresh(engineer)
        db.refresh(contractor)
        db.refresh(client)

        # 2. Create Projects
        proj1 = Project(
            name="Skyline Commercial Tower",
            description="24-Story LEED Certified Commercial Headquarters Tower with Underground Parking.",
            location="Downtown Business District, Sector 4",
            start_date=datetime.datetime(2026, 1, 15),
            end_date=datetime.datetime(2027, 6, 30),
            budget=15000000.0,
            spent_budget=3450000.0,
            status=ProjectStatus.IN_PROGRESS.value,
            manager_id=manager.id,
            client_id=client.id
        )

        proj2 = Project(
            name="Green Valley Residential Villas",
            description="Phase 1: 15 Luxury Smart Sustainable Townhouses.",
            location="Green Valley Heights",
            start_date=datetime.datetime(2026, 3, 1),
            end_date=datetime.datetime(2026, 12, 20),
            budget=4500000.0,
            spent_budget=1200000.0,
            status=ProjectStatus.IN_PROGRESS.value,
            manager_id=manager.id,
            client_id=client.id
        )

        db.add_all([proj1, proj2])
        db.commit()
        db.refresh(proj1)
        db.refresh(proj2)

        # 3. Create Project Milestones
        ms1 = ProjectMilestone(
            project_id=proj1.id,
            title="Site Excavation & Deep Foundation Piling",
            description="Deep basement soil excavation and installation of 120 concrete foundation piles.",
            due_date=datetime.datetime(2026, 4, 30),
            completion_percentage=100.0,
            status=MilestoneStatus.COMPLETED.value
        )
        ms2 = ProjectMilestone(
            project_id=proj1.id,
            title="Substructure & Basement Concrete Pouring",
            description="Casting double basement slab and reinforced concrete retaining walls.",
            due_date=datetime.datetime(2026, 8, 15),
            completion_percentage=75.0,
            status=MilestoneStatus.IN_PROGRESS.value
        )
        ms3 = ProjectMilestone(
            project_id=proj1.id,
            title="Steel Superstructure Framing (Floors 1-12)",
            description="Erection of structural steel beams and columns for lower floors.",
            due_date=datetime.datetime(2026, 11, 30),
            completion_percentage=10.0,
            status=MilestoneStatus.IN_PROGRESS.value
        )

        ms4 = ProjectMilestone(
            project_id=proj2.id,
            title="Land Grading & Infrastructure Laying",
            description="Site leveling, drainage pipe laying, and utility ducting.",
            due_date=datetime.datetime(2026, 5, 15),
            completion_percentage=100.0,
            status=MilestoneStatus.COMPLETED.value
        )

        db.add_all([ms1, ms2, ms3, ms4])

        # 4. Create Resources
        r1 = Resource(
            name="Caterpillar 320 Hydraulic Excavator",
            resource_type=ResourceType.MACHINERY.value,
            serial_number="CAT-320-EXC-2024-09",
            cost_per_hour=150.0,
            status=ResourceStatus.ALLOCATED.value,
            project_id=proj1.id,
            notes="Active in foundation zone B"
        )
        r2 = Resource(
            name="Potain MC 175B Tower Crane",
            resource_type=ResourceType.EQUIPMENT.value,
            serial_number="CRANE-TC-500-88",
            cost_per_hour=220.0,
            status=ResourceStatus.ALLOCATED.value,
            project_id=proj1.id,
            notes="Stationed at central core pillar"
        )
        r3 = Resource(
            name="JCB 3CX Backhoe Loader",
            resource_type=ResourceType.MACHINERY.value,
            serial_number="JCB-3CX-7741",
            cost_per_hour=95.0,
            status=ResourceStatus.AVAILABLE.value,
            notes="Parked at main equipment yard"
        )

        db.add_all([r1, r2, r3])

        # 5. Create Inventory
        inv1 = Inventory(
            project_id=proj1.id,
            item_name="Portland Cement Grade 53",
            category="Cement & Concrete",
            unit="Bags",
            quantity=850.0,
            min_threshold_quantity=200.0,
            unit_cost=8.5,
            supplier_name="UltraTech Cement Supplies",
            location="Bay 3 Main Warehouse"
        )
        inv2 = Inventory(
            project_id=proj1.id,
            item_name="TMT Steel Rebars (16mm)",
            category="Steel & Metal",
            unit="Tons",
            quantity=12.5,
            min_threshold_quantity=15.0, # Low stock alert trigger!
            unit_cost=750.0,
            supplier_name="Jindal Steel Works",
            location="Outdoor Steel Yard A"
        )
        inv3 = Inventory(
            project_id=proj2.id,
            item_name="Red Clay Bricks",
            category="Masonry",
            unit="Units",
            quantity=15000.0,
            min_threshold_quantity=2000.0,
            unit_cost=0.45,
            supplier_name="Premier Brick Kiln Ltd.",
            location="Villa Site Staging Area"
        )

        db.add_all([inv1, inv2, inv3])

        # 6. Create Workers
        w1 = Worker(
            name="Rajesh Kumar",
            trade="Mason",
            phone="+1-555-9011",
            daily_rate=120.0,
            contractor_id=contractor.id
        )
        w2 = Worker(
            name="Suresh Sharma",
            trade="Electrician",
            phone="+1-555-9012",
            daily_rate=140.0,
            contractor_id=contractor.id
        )
        w3 = Worker(
            name="Vikram Singh",
            trade="Steel Fixer",
            phone="+1-555-9013",
            daily_rate=130.0,
            contractor_id=contractor.id
        )

        db.add_all([w1, w2, w3])
        db.commit()
        db.refresh(w1)
        db.refresh(w2)
        db.refresh(w3)

        # 7. Create Attendance
        today = datetime.date.today()
        att1 = Attendance(
            worker_id=w1.id,
            project_id=proj1.id,
            date=today,
            status=AttendanceStatus.PRESENT.value,
            hours_worked=8.0,
            notes="Foundation reinforcement beam binding"
        )
        att2 = Attendance(
            worker_id=w2.id,
            project_id=proj1.id,
            date=today,
            status=AttendanceStatus.OVERTIME.value,
            hours_worked=10.0,
            notes="Substation cabling setup"
        )

        db.add_all([att1, att2])

        # 8. Create Procurements
        p1 = Procurement(
            project_id=proj1.id,
            requested_by_id=engineer.id,
            item_name="Ready-Mix Concrete M35 (30 cu.m)",
            quantity=30.0,
            unit="cu.m",
            estimated_cost=3600.0,
            status=ProcurementStatus.APPROVED.value,
            supplier_name="ACME Concrete Corp",
            notes="Scheduled delivery for Friday morning poured pour"
        )
        p2 = Procurement(
            project_id=proj1.id,
            requested_by_id=engineer.id,
            item_name="Safety Helmets & High-Vis Harnesses (50 Sets)",
            quantity=50.0,
            unit="Sets",
            estimated_cost=1250.0,
            status=ProcurementStatus.PENDING.value,
            supplier_name="BuildSafe Supplies",
            notes="For new site expansion crew"
        )

        db.add_all([p1, p2])

        # 9. Create Notifications
        n1 = Notification(
            user_id=manager.id,
            title="Low Stock Warning: TMT Steel Rebars",
            message="Material 'TMT Steel Rebars (16mm)' quantity (12.5 Tons) is below minimum threshold (15.0 Tons).",
            type="warning"
        )
        n2 = Notification(
            user_id=client.id,
            title="Milestone Completed",
            message="Milestone 'Site Excavation & Deep Foundation Piling' marked completed for Skyline Commercial Tower.",
            type="info"
        )

        db.add_all([n1, n2])

        # 10. Create Reports & Documents
        r_doc = Report(
            project_id=proj1.id,
            generated_by_id=manager.id,
            title="Q2 Monthly Construction Progress & Financial Summary",
            report_type="summary",
            summary_notes="Substructure excavation completed 5 days ahead of schedule. Budget remains within 2% variance margin.",
            content_json={
                "progress_percentage": 35.5,
                "spent": 3450000.0,
                "safety_incidents": 0
            }
        )

        doc1 = Document(
            project_id=proj1.id,
            title="Approved Structural Architectural Blueprints Rev 4.2",
            category="Blueprint",
            file_path="/uploads/documents/skyline_blueprints_v4.pdf",
            uploaded_by=engineer.full_name
        )

        db.add_all([r_doc, doc1])
        db.commit()

        print("Database seeded successfully with initial test data!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
