from pymongo import MongoClient
from bson import ObjectId
from transformers import pipeline


MONGO_URI ="mongodb+srv://sawsan:kzFUSu1DAucqE53h@cluster0.rwcyv8y.mongodb.net/jolocalDB?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME = "jolocalDB"
PRODUCTS_COLLECTION = "products"
REVIEWS_COLLECTION = "reviews"


client = MongoClient(MONGO_URI)
db = client[DB_NAME]
products = db[PRODUCTS_COLLECTION]
reviews = db[REVIEWS_COLLECTION]

# Load the summarizer model
print("Loading model...")
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")


def summarize_reviews_for_product(product_id_str):
    product_id = ObjectId(product_id_str)

    # Fetch all reviews for this product
    review_docs = list(reviews.find({ "productId": product_id_str }))  # your productId is a string!
    review_texts = [doc['comment'] for doc in review_docs]

    if not review_texts:
        print("⚠️ No reviews found.")
        return

    full_text = " ".join(review_texts)
    if len(full_text) > 4000:
        full_text = full_text[:4000]

    # Generate summary
    summary = summarizer(full_text, max_length=60, min_length=20, do_sample=False)
    summary_text = summary[0]['summary_text']

    # Update product with summary
    result = products.update_one(
        { "_id": product_id },
        { "$set": { "summary": summary_text } }
    )

    print(f"✅ Summary saved to product {product_id}:\n{summary_text}")

# === EXAMPLE USAGE ===
if __name__ == "__main__":
    summarize_reviews_for_product("68165a4924f113c614c0b996")  # Replace with actual product ID as string
