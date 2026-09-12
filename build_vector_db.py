import os
from langchain_community.document_loaders import TextLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

def build_vector_database():
    print("Initializing Vector Database Build Process...")
    
    # 1. Load Documents
    knowledge_dir = "ayurveda_knowledge"
    if not os.path.exists(knowledge_dir):
        print(f"Error: Directory '{knowledge_dir}' not found.")
        return
        
    print(f"Loading documents from {knowledge_dir}...")
    loader = DirectoryLoader(knowledge_dir, glob="**/*.txt", loader_cls=TextLoader)
    documents = loader.load()
    print(f"Loaded {len(documents)} document(s).")
    
    # 2. Split Text into Chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100,
        length_function=len
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Split documents into {len(chunks)} chunks.")
    
    # 3. Create Embeddings (using a fast, local HuggingFace model)
    print("Downloading/Loading Embedding Model (all-MiniLM-L6-v2)...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    # 4. Create and Save FAISS Vector Store
    print("Generating vectors and building FAISS index...")
    vectorstore = FAISS.from_documents(chunks, embeddings)
    
    # Save the index locally
    output_dir = "vector_db"
    vectorstore.save_local(output_dir)
    print(f"Success! Vector database saved to './{output_dir}'.")

if __name__ == "__main__":
    build_vector_database()
