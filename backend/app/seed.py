from app.database import SessionLocal, Base, engine
from app.models import Organization, User, Product, ProductEmbedding, Document, Invoice, InvoiceItem
from app.services.auth_service import hash_password
from app.services.document_service import document_service
from app.services.visual_search_service import visual_search_service
from app.utils.logger import logger

def seed_database():
    logger.info("Starting database seed routine...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        org = db.query(Organization).filter(Organization.slug == "designops-corp").first()
        if not org:
            org = Organization(name="DesignOps Enterprise", slug="designops-corp")
            db.add(org)
            db.flush()

            # Seed Admin User
            admin_user = User(
                organization_id=org.id,
                email="admin@designops.ai",
                hashed_password=hash_password("DesignOps2026!"),
                full_name="Enterprise Admin",
                role="admin"
            )
            db.add(admin_user)

            # Seed Demo Products for Visual Search
            demo_products = [
                {
                    "sku": "DS-CHAIR-01",
                    "name": "Ergonomic Mesh Task Chair",
                    "category": "Office Furniture",
                    "description": "High-durability ergonomic lumbar support chair designed for enterprise workspaces.",
                    "price": 289.00,
                    "image_url": "https://images.unsplash.com/photo-1580481077195-c22ae224b10b?w=400&auto=format&fit=crop"
                },
                {
                    "sku": "DS-DESK-02",
                    "name": "Motorized Sit-Stand Desk",
                    "category": "Office Furniture",
                    "description": "Dual-motor height-adjustable standing desk with solid oak desktop.",
                    "price": 549.00,
                    "image_url": "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=400&auto=format&fit=crop"
                },
                {
                    "sku": "DS-LAMP-03",
                    "name": "Architectural LED Task Light",
                    "category": "Lighting",
                    "description": "Dimmable color-temperature controlled architectural studio lamp.",
                    "price": 129.00,
                    "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&auto=format&fit=crop"
                },
                {
                    "sku": "DS-MON-04",
                    "name": "Ultra-Wide 34\" IPS Monitor",
                    "category": "Electronics",
                    "description": "Curved high-resolution enterprise monitor with USB-C power delivery.",
                    "price": 699.00,
                    "image_url": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&auto=format&fit=crop"
                }
            ]

            for p_data in demo_products:
                prod = Product(
                    organization_id=org.id,
                    sku=p_data["sku"],
                    name=p_data["name"],
                    category=p_data["category"],
                    description=p_data["description"],
                    price=p_data["price"],
                    image_url=p_data["image_url"]
                )
                db.add(prod)
                db.flush()

                # Generate simulated perceptual embedding vector
                emb_vec = document_service.generate_embedding(f"{p_data['name']} {p_data['category']} {p_data['description']}")
                embedding = ProductEmbedding(
                    product_id=prod.id,
                    feature_vector=emb_vec,
                    model_name="openclip-vit-b-32"
                )
                db.add(embedding)

            # Seed a sample invoice
            invoice = Invoice(
                organization_id=org.id,
                invoice_number="INV-2026-0891",
                vendor_name="Apex Cloud Systems Inc.",
                invoice_date="2026-11-15",
                due_date="2026-12-15",
                subtotal=3200.00,
                tax_amount=320.00,
                total_amount=3520.00,
                currency="USD",
                confidence_score=0.98,
                status="extracted"
            )
            db.add(invoice)
            db.flush()

            db.add(InvoiceItem(
                invoice_id=invoice.id,
                description="Enterprise High-Availability Compute Cluster",
                quantity=1.0,
                unit_price=3200.00,
                total_price=3200.00
            ))

            db.commit()
            logger.info("Database successfully seeded with default enterprise organization, admin, products and sample invoice.")
        else:
            logger.info("Database already seeded. Skipping initial seed.")

    except Exception as e:
        db.rollback()
        logger.error(f"Seeding failed: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
