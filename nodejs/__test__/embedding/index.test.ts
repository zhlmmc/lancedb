import { Float32, Int32, Utf8 } from "../../lancedb/arrow";
import { LanceSchema } from "../../lancedb/embedding";
import { EmbeddingFunction } from "../../lancedb/embedding/embedding_function";

class TestEmbeddingFunction extends EmbeddingFunction {
  constructor() {
    super();
  }

  embeddingDataType() {
    return new Float32();
  }

  async computeSourceEmbeddings(texts: string[]): Promise<number[][]> {
    return texts.map(() => [1, 2, 3]);
  }

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map(() => [1, 2, 3]);
  }
}

describe("LanceSchema", () => {
  it("should create schema with basic fields", () => {
    const schema = LanceSchema({
      id: new Int32(),
      text: new Utf8(),
    });

    expect(schema.fields.length).toBe(2);
    expect(schema.fields[0].name).toBe("id");
    expect(schema.fields[1].name).toBe("text");
  });

  it("should create schema with embedding functions", () => {
    const func = new TestEmbeddingFunction();
    const schema = LanceSchema({
      id: new Int32(),
      text: [new Utf8(), new Map([["source_column_for", func]])],
      vector: [new Float32(), new Map([["vector_column_for", func]])],
    });

    expect(schema.fields.length).toBe(3);
    expect(schema.metadata?.get("embedding_functions")).toBeDefined();
  });

  it("should handle multiple embedding functions", () => {
    const func1 = new TestEmbeddingFunction();
    const func2 = new TestEmbeddingFunction();

    const schema = LanceSchema({
      id: new Int32(),
      text1: [new Utf8(), new Map([["source_column_for", func1]])],
      vector1: [new Float32(), new Map([["vector_column_for", func1]])],
      text2: [new Utf8(), new Map([["source_column_for", func2]])],
      vector2: [new Float32(), new Map([["vector_column_for", func2]])],
    });

    expect(schema.fields.length).toBe(5);
    expect(schema.metadata?.get("embedding_functions")).toBeDefined();
  });

  it("should handle empty metadata map", () => {
    const schema = LanceSchema({
      id: new Int32(),
      text: [new Utf8(), new Map()],
    });

    expect(schema.fields.length).toBe(2);
    // Schema will have default metadata even with empty map
    expect(schema.metadata?.size).toBe(1);
  });

  it("should handle undefined metadata", () => {
    const schema = LanceSchema({
      id: new Int32(),
      text: [new Utf8(), new Map([["some_other_key", "value"]])],
    });

    expect(schema.fields.length).toBe(2);
    // Schema will have default metadata
    expect(schema.metadata?.size).toBe(1);
  });

  it("should handle source column without vector column", () => {
    const func = new TestEmbeddingFunction();
    const schema = LanceSchema({
      id: new Int32(),
      text: [new Utf8(), new Map([["source_column_for", func]])],
    });

    expect(schema.fields.length).toBe(2);
    expect(schema.metadata?.get("embedding_functions")).toBeDefined();
  });

  it("should handle vector column without source column", () => {
    const func = new TestEmbeddingFunction();
    const schema = LanceSchema({
      id: new Int32(),
      vector: [new Float32(), new Map([["vector_column_for", func]])],
    });

    expect(schema.fields.length).toBe(2);
    expect(schema.metadata?.get("embedding_functions")).toBeDefined();
  });

  it("should handle updating existing embedding function config", () => {
    const func = new TestEmbeddingFunction();
    const schema = LanceSchema({
      id: new Int32(),
      text: [new Utf8(), new Map([["source_column_for", func]])],
      text2: [new Utf8(), new Map([["source_column_for", func]])],
      vector: [new Float32(), new Map([["vector_column_for", func]])],
    });

    expect(schema.fields.length).toBe(4);
    expect(schema.metadata?.get("embedding_functions")).toBeDefined();
  });

  it("should handle multiple vector columns for same function", () => {
    const func = new TestEmbeddingFunction();
    const schema = LanceSchema({
      id: new Int32(),
      text: [new Utf8(), new Map([["source_column_for", func]])],
      vector1: [new Float32(), new Map([["vector_column_for", func]])],
      vector2: [new Float32(), new Map([["vector_column_for", func]])],
    });

    expect(schema.fields.length).toBe(4);
    expect(schema.metadata?.get("embedding_functions")).toBeDefined();
  });
});
