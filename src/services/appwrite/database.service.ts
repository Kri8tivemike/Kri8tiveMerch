import { databases, ID } from '../../lib/appwrite';
import { Query } from 'appwrite';

export class DatabaseService {
  private databaseId: string;
  private collectionId: string;

  constructor(databaseId: string, collectionId: string) {
    this.databaseId = databaseId;
    this.collectionId = collectionId;
  }

  // Create a document
  async create<T>(data: Partial<T>) {
    try {
      const response = await databases.createDocument(
        this.databaseId,
        this.collectionId,
        ID.unique(),
        data
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Create a document with a specific ID
  async createWithId<T>(id: string, data: Partial<T>) {
    try {
      const response = await databases.createDocument(
        this.databaseId,
        this.collectionId,
        id,
        data
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Read one document by ID
  async getOne(documentId: string) {
    try {
      const response = await databases.getDocument(
        this.databaseId,
        this.collectionId,
        documentId
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Read multiple documents
  async list(queries: string[] = []) {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        queries
      );
      return { success: true, data: response.documents, total: response.total };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Update a document
  async update<T>(documentId: string, data: Partial<T>) {
    try {
      const response = await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        documentId,
        data
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Delete a document
  async delete(documentId: string) {
    try {
      await databases.deleteDocument(
        this.databaseId,
        this.collectionId,
        documentId
      );
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Helper method to generate query for equal comparison
  static equal(attribute: string, value: string | number | boolean) {
    return Query.equal(attribute, value);
  }

  // Helper method to generate query for not equal comparison
  static notEqual(attribute: string, value: string | number | boolean) {
    return Query.notEqual(attribute, value);
  }

  // Helper method to generate query for greater than comparison
  static greaterThan(attribute: string, value: number) {
    return Query.greaterThan(attribute, value);
  }

  // Helper method to generate query for less than comparison
  static lessThan(attribute: string, value: number) {
    return Query.lessThan(attribute, value);
  }

  // Helper method to generate query for orderDesc
  static orderDesc(attribute: string) {
    return Query.orderDesc(attribute);
  }

  // Helper method to generate query for orderAsc
  static orderAsc(attribute: string) {
    return Query.orderAsc(attribute);
  }

  // Helper method to generate query for limit
  static limit(limit: number) {
    return Query.limit(limit);
  }

  // Helper method to generate query for offset
  static offset(offset: number) {
    return Query.offset(offset);
  }
} 