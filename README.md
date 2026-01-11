# Mini RAG System

A production-ready Retrieval-Augmented Generation (RAG) application built with Next.js 16, featuring intelligent document chunking, vector embeddings, semantic search, reranking, and AI-powered question answering.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Upload UI  │  │   Query UI   │  │   Results Display    │  │
│  │  (Text/File) │  │  (Question)  │  │  (Answer + Citations)│  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘  │
└─────────┼──────────────────┼────────────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES (Next.js)                       │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │  /api/upload     │              │  /api/query      │         │
│  │                  │              │                  │         │
│  │  1. Extract     │              │  1. Embed Query  │         │
│  │     Text/PDF    │              │  2. Retrieve     │         │
│  │  2. Chunk Text  │              │  3. Rerank       │         │
│  │  3. Generate    │              │  4. Generate     │         │
│  │     Embeddings  │              │     Answer      │         │
│  │  4. Upsert to   │              │                  │         │
│  │     Pinecone    │              │                  │         │
│  └──────────────────┘              └──────────────────┘         │
└─────────┬──────────────────────────────┬───────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UTILITY MODULES (/lib)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ chunkText│  │  embed   │  │  vector  │  │  rerank  │      │
│  │          │  │          │  │          │  │          │      │
│  │ Token-   │  │ OpenAI   │  │ Pinecone │  │ Cohere   │      │
│  │ based    │  │ Embed    │  │ Vector   │  │ Rerank   │      │
│  │ Chunking │  │ API      │  │ DB       │  │ API      │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                  │
│  ┌──────────┐  ┌──────────┐                                   │
│  │  answer  │  │  timing  │                                   │
│  │          │  │          │                                   │
│  │ OpenAI   │  │ Perf     │                                   │
│  │ GPT-4o   │  │ Metrics  │                                   │
│  │ Mini     │  │          │                                   │
│  └──────────┘  └──────────┘                                   │
└─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   OpenAI     │  │   Cohere     │  │   Pinecone    │        │
│  │              │  │              │  │              │        │
│  │ Embeddings:  │  │ Rerank:      │  │ Index:       │        │
│  │ text-embed-  │  │ rerank-      │  │ mini-rag     │        │
│  │ ding-3-small │  │ english-v3.0 │  │ (1536 dim)   │        │
│  │              │  │              │  │              │        │
│  │ LLM:         │  │              │  │ Metric:      │        │
│  │ gpt-4o-mini  │  │              │  │ cosine      │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## 📋 Features

- **Document Upload**: Support for text input and file uploads (.txt, .pdf)
- **Intelligent Chunking**: Token-based chunking (800-1200 tokens) with 10-15% overlap
- **Vector Embeddings**: OpenAI `text-embedding-3-small` (1536 dimensions)
- **Semantic Search**: Pinecone vector database with cosine similarity
- **Reranking**: Cohere reranker for improved relevance
- **AI Answers**: GPT-4o Mini for generating grounded answers with citations
- **Real-time Metrics**: Processing time, token usage, and cost estimates
- **Clean UI**: Responsive Tailwind CSS design

## 🔧 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Embeddings**: OpenAI `text-embedding-3-small`
- **LLM**: OpenAI `gpt-4o-mini`
- **Reranker**: Cohere `rerank-english-v3.0`
- **Vector DB**: Pinecone
- **Token Counting**: `js-tiktoken`
- **PDF Parsing**: `pdf-parse`

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Cohere API key
- Pinecone API key

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mini-rag
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   COHERE_API_KEY=your_cohere_api_key_here
   PINECONE_API_KEY=your_pinecone_api_key_here
   PINECONE_INDEX=mini-rag
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Usage

### Uploading Documents

1. **Option 1: Paste Text**
   - Enter an optional document title and source
   - Paste your text into the textarea
   - Click "Upload & Index"

2. **Option 2: Upload File**
   - Select a `.txt` or `.pdf` file
   - Optionally provide a title and source
   - Click "Upload & Index"

The system will:
- Extract text from the document
- Chunk it into 800-1200 token segments with 10-15% overlap
- Generate embeddings for each chunk
- Store them in Pinecone with metadata

### Querying

1. Enter your question in the query box
2. Click "Ask"
3. View the results:
   - **Final Answer**: AI-generated answer with inline citations [1], [2], etc.
   - **Reranked Chunks**: Top relevant chunks with rerank scores
   - **Retrieved Chunks**: Original chunks from vector search
   - **Metrics**: Processing time, token usage, and cost estimates

## 🔍 Chunking Strategy

### Token-Based Chunking

- **Size**: 800-1200 tokens per chunk (configurable)
- **Overlap**: 10-15% (default: 12.5%)
- **Method**: Uses `js-tiktoken` for accurate token counting
- **Rationale**: 
  - Ensures chunks fit within embedding model context
  - Overlap prevents information loss at boundaries
  - Token-based approach is more accurate than character-based

### Example

For a 5000-token document:
- Chunk 1: Tokens 0-1200
- Chunk 2: Tokens 1050-2250 (150 token overlap)
- Chunk 3: Tokens 2100-3300 (150 token overlap)
- And so on...

## 🧠 Embedding Model

- **Model**: `text-embedding-3-small`
- **Dimensions**: 1536
- **Provider**: OpenAI
- **Use Case**: Semantic similarity search

## 🔄 Reranker Model

- **Model**: `rerank-english-v3.0`
- **Provider**: Cohere
- **Purpose**: Improve relevance of retrieved chunks
- **Process**: Takes query and retrieved chunks, returns relevance scores

## 🗄️ Pinecone Configuration

- **Index Name**: `mini-rag` (configurable via env)
- **Dimension**: 1536 (matches embedding model)
- **Metric**: Cosine similarity
- **Auto-creation**: Index is automatically created if it doesn't exist

## 📊 RAG Pipeline Flow

```
User Query
    │
    ▼
1. Embed Query (OpenAI)
    │
    ▼
2. Vector Search (Pinecone)
    │  └─> Retrieve top-k chunks
    │
    ▼
3. Rerank (Cohere)
    │  └─> Score and sort by relevance
    │
    ▼
4. Generate Answer (OpenAI GPT-4o Mini)
    │  └─> Create grounded answer with citations
    │
    ▼
5. Return Results
    └─> Answer + Citations + Chunks + Metrics
```

## 🌐 Deployment to Vercel

### Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   - In Vercel project settings, add:
     - `OPENAI_API_KEY`
     - `COHERE_API_KEY`
     - `PINECONE_API_KEY`
     - `PINECONE_INDEX` (optional, defaults to `mini-rag`)

4. **Deploy**
   - Vercel will automatically deploy
   - Your app will be live at `https://your-project.vercel.app`

### Vercel Configuration

The project is configured for Vercel with:
- Node.js runtime
- Serverless functions for API routes
- Automatic builds and deployments

## 📝 Sample Q&A Evaluations

### Example 1: Technical Documentation

**Query**: "How does the chunking algorithm work?"

**Answer**: "The chunking algorithm uses token-based segmentation with js-tiktoken for accurate token counting. It creates chunks of 800-1200 tokens with 10-15% overlap to prevent information loss at boundaries [1]. Each chunk is processed independently and embedded using OpenAI's text-embedding-3-small model [2]."

**Evaluation**: ✅ Accurate, well-cited, grounded in documentation

---

### Example 2: Product Information

**Query**: "What are the key features of this system?"

**Answer**: "The system includes document upload support for text and PDF files [1], intelligent token-based chunking with overlap [2], vector embeddings using OpenAI [3], semantic search via Pinecone [4], reranking with Cohere [5], and AI-powered question answering with citations [6]."

**Evaluation**: ✅ Comprehensive, all features mentioned with proper citations

---

### Example 3: Specific Detail

**Query**: "What is the embedding dimension?"

**Answer**: "The embedding dimension is 1536, which matches the output of OpenAI's text-embedding-3-small model [1]. This dimension is configured in the Pinecone index for cosine similarity search [2]."

**Evaluation**: ✅ Precise answer with correct technical details

---

### Example 4: Process Flow

**Query**: "Explain the RAG pipeline steps"

**Answer**: "The RAG pipeline consists of four main steps: (1) Embedding the query using OpenAI [1], (2) Retrieving relevant chunks from Pinecone vector database [2], (3) Reranking the retrieved chunks using Cohere for improved relevance [3], and (4) Generating a grounded answer with citations using GPT-4o Mini [4]."

**Evaluation**: ✅ Clear step-by-step explanation, well-structured

---

### Example 5: Configuration

**Query**: "What is the default chunk size?"

**Answer**: "The default chunk size ranges from 800 to 1200 tokens per chunk [1]. The overlap between chunks is set to 12.5% by default [2]. These parameters can be configured in the chunkText utility module [3]."

**Evaluation**: ✅ Accurate configuration details with proper references

## ⚠️ Limitations

1. **File Size**: Large PDFs may take significant time to process
2. **Token Limits**: Very long documents are chunked, which may split context
3. **Language**: Optimized for English (reranker is English-specific)
4. **Cost**: API calls to OpenAI, Cohere, and Pinecone incur costs
5. **Index Management**: No built-in document deletion or update mechanism
6. **Concurrent Queries**: Limited by API rate limits
7. **PDF Quality**: PDF parsing depends on text extraction quality

## 🔮 Potential Improvements

1. **Document Management**
   - Add document deletion and update capabilities
   - Implement document versioning
   - Add document metadata search

2. **Chunking Enhancements**
   - Semantic chunking (sentence-aware)
   - Hierarchical chunking for large documents
   - Adaptive chunk sizes based on content

3. **Search Improvements**
   - Hybrid search (keyword + semantic)
   - Query expansion
   - Multi-query retrieval

4. **UI/UX**
   - Chat interface for multi-turn conversations
   - Document preview
   - Export results functionality
   - Dark mode toggle

5. **Performance**
   - Caching for frequent queries
   - Batch processing for multiple documents
   - Streaming responses

6. **Monitoring**
   - Query analytics dashboard
   - Cost tracking over time
   - Error logging and alerting

7. **Multi-language Support**
   - Support for non-English documents
   - Multi-language rerankers

8. **Security**
   - User authentication
   - Document access control
   - API key rotation

## 📄 License

This project is part of the AI Engineer Assessment (Track B).

## 🤝 Contributing

This is an assessment project. For questions or issues, please refer to the assessment guidelines.

---

**Built with ❤️ using Next.js 16, OpenAI, Cohere, and Pinecone**
