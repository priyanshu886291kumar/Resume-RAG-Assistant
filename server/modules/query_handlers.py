from logger import logger



def query_chain(chain,user_input:str):
    try:
        logger.debug(f"Running chain for input: {user_input}")
        result=chain.invoke({"query":user_input})
        
        sources = []
        for doc in result.get("source_documents", []):
            source_path = doc.metadata.get("source", "")
            filename = source_path.split("\\")[-1].split("/")[-1] if source_path else "Unknown"
            source_info = {"filename": filename}
            if "chunk_index" in doc.metadata:
                source_info["chunk_index"] = doc.metadata["chunk_index"]
            elif "page" in doc.metadata:
                source_info["chunk_index"] = f"Page {doc.metadata['page']}"
            sources.append(source_info)

        response={
            "response":result["result"],
            "sources": sources
        }
        logger.debug(f"Chain response: {response}")
        return response
    except Exception as e:
        logger.exception("Error in query_chain")
        raise