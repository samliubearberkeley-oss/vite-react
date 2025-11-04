/**
 * Mock Insforge client for local development/testing
 * Stores data in localStorage when Insforge is not configured
 */

class MockStorage {
  constructor(bucketName) {
    this.bucketName = bucketName;
    this.storageKey = `mock_storage_${bucketName}`;
  }

  upload(filename, blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        const storage = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        storage[filename] = base64;
        localStorage.setItem(this.storageKey, JSON.stringify(storage));
        
        // Return mock URL (return full data URL)
        resolve({
          data: {
            url: base64, // Full data URL for mock
            key: filename
          },
          error: null
        });
      };
      reader.readAsDataURL(blob);
    });
  }
}

class MockDatabase {
  constructor(tableName) {
    this.tableName = tableName;
    this.storageKey = `mock_db_${tableName}`;
  }

  select(columns = '*') {
    this.selectCalled = true;
    return this;
  }

  eq(field, value) {
    this.filters = this.filters || [];
    this.filters.push({ field, value });
    return this;
  }

  order(field, options = {}) {
    this.orderBy = { field, ascending: options.ascending !== false };
    this.selectCalled = true; // Mark that a query is pending
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  async execute() {
    const storage = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    console.log(`[MockDB] execute() called for table "${this.tableName}", storage key: "${this.storageKey}", found ${storage.length} items`);
    let results = [...storage];

    // Apply filters
    if (this.filters) {
      console.log(`[MockDB] Applying ${this.filters.length} filters`);
      results = results.filter(item => {
        return this.filters.every(filter => item[filter.field] === filter.value);
      });
    }

    // Apply ordering
    if (this.orderBy) {
      console.log(`[MockDB] Applying order by ${this.orderBy.field}, ascending: ${this.orderBy.ascending}`);
      results.sort((a, b) => {
        const aVal = a[this.orderBy.field];
        const bVal = b[this.orderBy.field];
        if (this.orderBy.ascending) {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    // Apply limit
    if (this.limitCount) {
      results = results.slice(0, this.limitCount);
    }

    console.log(`[MockDB] execute() returning ${results.length} results:`, results);
    return { data: results, error: null };
  }

  async maybeSingle() {
    const result = await this.execute();
    if (result.error) {
      return result;
    }
    // Return first result or null if no results
    return { 
      data: result.data && result.data.length > 0 ? result.data[0] : null, 
      error: null 
    };
  }

  async single() {
    const result = await this.execute();
    if (result.error) {
      return result;
    }
    // Return first result or error if no results
    if (!result.data || result.data.length === 0) {
      return { 
        data: null, 
        error: { 
          code: 'PGRST116', 
          message: 'JSON object requested, multiple (or no) rows returned' 
        } 
      };
    }
    if (result.data.length > 1) {
      return { 
        data: null, 
        error: { 
          code: 'PGRST116', 
          message: 'JSON object requested, multiple rows returned' 
        } 
      };
    }
    return { data: result.data[0], error: null };
  }

  insert(values) {
    return {
      select: () => ({
        single: async () => {
          const storage = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
          const insertData = Array.isArray(values) ? values[0] : values;
          
          // Check for duplicate ID (for users table uniqueness)
          if (insertData.id && storage.some(item => item.id === insertData.id)) {
            return { 
              data: null, 
              error: { 
                code: '23505', 
                message: 'duplicate key value violates unique constraint' 
              } 
            };
          }
          
          const newRecord = {
            id: insertData.id || crypto.randomUUID(),
            ...insertData,
          };
          
          // Add default fields for dogs table
          if (this.tableName === 'dogs') {
            newRecord.likes = newRecord.likes || 0;
            newRecord.dislikes = newRecord.dislikes || 0;
          }
          
          // Add created_at if not present
          if (!newRecord.created_at) {
            newRecord.created_at = new Date().toISOString();
          }
          
          storage.push(newRecord);
          localStorage.setItem(this.storageKey, JSON.stringify(storage));
          console.log(`[MockDB] insert() saved to "${this.storageKey}":`, newRecord);
          console.log(`[MockDB] Total items in storage: ${storage.length}`);
          return { data: newRecord, error: null };
        }
      })
    };
  }

  update(values) {
    this.updateValues = values;
    return this;
  }

  async executeUpdate() {
    const storage = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    let updated = false;

    const results = storage.map(item => {
      // Check if item matches filters
      const matches = this.filters ? this.filters.every(filter => item[filter.field] === filter.value) : false;
      
      if (matches) {
        updated = true;
        return { ...item, ...this.updateValues };
      }
      return item;
    });

    if (updated) {
      localStorage.setItem(this.storageKey, JSON.stringify(results));
      return { data: results.filter(item => 
        this.filters ? this.filters.every(filter => item[filter.field] === filter.value) : true
      ), error: null };
    }

    return { data: null, error: 'No matching records found' };
  }
}

export function createMockClient() {
  return {
    storage: {
      from: (bucketName) => {
        const storage = new MockStorage(bucketName);
        return storage;
      }
    },
    database: {
      from: (tableName) => {
        const mockDb = new MockDatabase(tableName);
        
        // Create a single query builder instance that is thenable
        const builder = {
          select: (columns = '*') => {
            mockDb.selectCalled = true;
            return builder;
          },
          eq: (field, value) => {
            mockDb.filters = mockDb.filters || [];
            mockDb.filters.push({ field, value });
            return builder;
          },
          order: (field, options = {}) => {
            mockDb.orderBy = { field, ascending: options.ascending !== false };
            mockDb.selectCalled = true;
            return builder;
          },
          limit: (count) => {
            mockDb.limitCount = count;
            return builder;
          },
          update: (values) => {
            mockDb.updateValues = values;
            return builder;
          },
          insert: (values) => {
            return mockDb.insert(values);
          },
          maybeSingle: async () => {
            return mockDb.maybeSingle();
          },
          single: async () => {
            return mockDb.single();
          },
          // Make builder thenable - CRITICAL for await to work
          then: (onResolve, onReject) => {
            let promise;
            if (mockDb.updateValues) {
              promise = Promise.resolve(mockDb.executeUpdate());
            } else if (mockDb.selectCalled || mockDb.filters || mockDb.orderBy || mockDb.limitCount) {
              promise = Promise.resolve(mockDb.execute());
            } else {
              promise = Promise.resolve({ data: null, error: null });
            }
            return promise.then(onResolve, onReject);
          },
          catch: (onReject) => {
            let promise;
            if (mockDb.updateValues) {
              promise = Promise.resolve(mockDb.executeUpdate());
            } else if (mockDb.selectCalled || mockDb.filters || mockDb.orderBy || mockDb.limitCount) {
              promise = Promise.resolve(mockDb.execute());
            } else {
              promise = Promise.resolve({ data: null, error: null });
            }
            return promise.catch(onReject);
          },
          finally: (onFinally) => {
            let promise;
            if (mockDb.updateValues) {
              promise = Promise.resolve(mockDb.executeUpdate());
            } else if (mockDb.selectCalled || mockDb.filters || mockDb.orderBy || mockDb.limitCount) {
              promise = Promise.resolve(mockDb.execute());
            } else {
              promise = Promise.resolve({ data: null, error: null });
            }
            return promise.finally(onFinally);
          }
        };
        
        // Return proxy that routes method calls to builder
        return new Proxy(mockDb, {
          get(target, prop) {
            // Insert goes directly to mockDb
            if (prop === 'insert') {
              return target[prop].bind(target);
            }
            
            // All other chainable methods go to builder
            if (prop === 'select' || prop === 'update' || prop === 'eq' || prop === 'order' || 
                prop === 'limit' || prop === 'maybeSingle' || prop === 'single' ||
                prop === 'then' || prop === 'catch' || prop === 'finally') {
              return builder[prop];
            }
            
            // Default: return from target
            const value = target[prop];
            if (typeof value === 'function') {
              return value.bind(target);
            }
            return value;
          }
        });
      }
    }
  };
}
