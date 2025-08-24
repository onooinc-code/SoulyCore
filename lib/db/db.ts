
"use client";

import type { Conversation, Message, Knowledge, Entity, Tool, Cache, Contact } from '@/lib/types';

const DB_NAME = 'SoulyCoreDB';
const DB_VERSION = 1;

let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(true);
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("Database error:", request.error);
            reject(false);
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(true);
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            if (!dbInstance.objectStoreNames.contains('conversations')) {
                dbInstance.createObjectStore('conversations', { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains('messages')) {
                const messageStore = dbInstance.createObjectStore('messages', { keyPath: 'id' });
                messageStore.createIndex('conversationId', 'conversationId', { unique: false });
            }
            if (!dbInstance.objectStoreNames.contains('knowledge')) {
                dbInstance.createObjectStore('knowledge', { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains('entities')) {
                dbInstance.createObjectStore('entities', { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains('tools')) {
                dbInstance.createObjectStore('tools', { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains('cache')) {
                dbInstance.createObjectStore('cache', { keyPath: 'key' });
            }
             if (!dbInstance.objectStoreNames.contains('contacts')) {
                dbInstance.createObjectStore('contacts', { keyPath: 'id' });
            }
        };
    });
};

const performDBRequest = <T>(storeName: string, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest): Promise<T> => {
    return new Promise((resolve, reject) => {
        if (!db) {
            return reject("DB not initialized");
        }
        try {
            const transaction = db.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);
            const request = operation(store);
            request.onsuccess = () => resolve(request.result as T);
            request.onerror = () => reject(request.error);
        } catch (error) {
            reject(error);
        }
    });
};

// Generic CRUD operations
const addItem = <T,>(storeName: string) => (item: T): Promise<IDBValidKey> => 
    performDBRequest(storeName, 'readwrite', store => store.add(item));

const updateItem = <T,>(storeName: string) => (item: T): Promise<IDBValidKey> =>
    performDBRequest(storeName, 'readwrite', store => store.put(item));

const getItem = <T,>(storeName: string) => (id: string): Promise<T | undefined> =>
    performDBRequest(storeName, 'readonly', store => store.get(id));

const getAllItems = <T,>(storeName: string) => (): Promise<T[]> =>
    performDBRequest(storeName, 'readonly', store => store.getAll());

const deleteItem = (storeName: string) => (id: string): Promise<void> =>
    performDBRequest(storeName, 'readwrite', store => store.delete(id));

const clearStore = (storeName: string) => (): Promise<void> =>
    performDBRequest(storeName, 'readwrite', store => store.clear());

const countItems = (storeName: string) => (): Promise<number> =>
    performDBRequest(storeName, 'readonly', store => store.count());


export const dbService = {
    conversations: {
        add: addItem<Conversation>('conversations'),
        update: updateItem<Conversation>('conversations'),
        get: getItem<Conversation>('conversations'),
        getAll: getAllItems<Conversation>('conversations'),
        delete: deleteItem('conversations'),
    },
    messages: {
        add: addItem<Message>('messages'),
        update: updateItem<Message>('messages'),
        get: getItem<Message>('messages'),
        getAll: getAllItems<Message>('messages'),
        getByConversation: (conversationId: string): Promise<Message[]> => {
            return new Promise((resolve, reject) => {
                if (!db) return reject("DB not initialized");
                const transaction = db.transaction('messages', 'readonly');
                const store = transaction.objectStore('messages');
                const index = store.index('conversationId');
                const request = index.getAll(conversationId);
                request.onsuccess = () => resolve(request.result.sort((a,b) => a.createdAt.getTime() - b.createdAt.getTime()));
                request.onerror = () => reject(request.error);
            });
        },
    },
    knowledge: {
        add: addItem<Knowledge>('knowledge'),
        update: updateItem<Knowledge>('knowledge'),
        getAll: getAllItems<Knowledge>('knowledge'),
        delete: deleteItem('knowledge'),
    },
    entities: {
        add: addItem<Entity>('entities'),
        update: updateItem<Entity>('entities'),
        get: getItem<Entity>('entities'),
        getAll: getAllItems<Entity>('entities'),
        delete: deleteItem('entities'),
    },
    tools: {
        add: addItem<Tool>('tools'),
        update: updateItem<Tool>('tools'),
        getAll: getAllItems<Tool>('tools'),
    },
    cache: {
        set: (item: Cache) => updateItem<Cache>('cache')(item),
        get: (key: string): Promise<Cache | undefined> => getItem<Cache>('cache')(key),
        delete: deleteItem('cache'),
        clear: clearStore('cache'),
        count: countItems('cache'),
    },
    contacts: {
        add: addItem<Contact>('contacts'),
        update: updateItem<Contact>('contacts'),
        get: getItem<Contact>('contacts'),
        getAll: getAllItems<Contact>('contacts'),
        delete: deleteItem('contacts'),
    },
};

// Seed initial data
export const seedInitialData = async () => {
    const exampleTools: Tool[] = [
        { id: 'tool_1', name: 'getWeather', description: 'Get the current weather for a specific location', schema_json: JSON.stringify({ type: 'object', properties: { location: { type: 'string', description: 'The city and state, e.g. San Francisco, CA' } }, required: ['location'] }) },
        { id: 'tool_2', name: 'searchInternet', description: 'Search the internet for information on a topic', schema_json: JSON.stringify({ type: 'object', properties: { query: { type: 'string', description: 'The search query' } }, required: ['query'] }) },
    ];
    // Use update (put) to make this operation idempotent, preventing race conditions from React StrictMode in dev.
    for (const tool of exampleTools) {
        await dbService.tools.update(tool);
    }
    console.log('Initial tools seeded/verified.');
};
