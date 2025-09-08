// 使用IndexedDB实现数据库功能
class DatabaseManager {
  private db: IDBDatabase | null = null;
  private dbName = 'chengguo_db';
  private version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('❌ IndexedDB打开失败');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB连接成功');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createTables(db);
      };
    });
  }

  private createTables(db: IDBDatabase): void {
    // 用户表
    if (!db.objectStoreNames.contains('users')) {
      const usersStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
      usersStore.createIndex('username', 'username', { unique: true });
      usersStore.createIndex('token', 'token', { unique: true });
    }

    // 游戏应用表
    if (!db.objectStoreNames.contains('games')) {
      const gamesStore = db.createObjectStore('games', { keyPath: 'id', autoIncrement: true });
      gamesStore.createIndex('appid', 'appid', { unique: true });
      gamesStore.createIndex('owner_id', 'owner_id', { unique: false });
    }

    // eCPM数据表
    if (!db.objectStoreNames.contains('ecpm_data')) {
      const ecpmStore = db.createObjectStore('ecpm_data', { keyPath: 'id', autoIncrement: true });
      ecpmStore.createIndex('game_id', 'game_id', { unique: false });
      ecpmStore.createIndex('event_time', 'event_time', { unique: false });
    }

    console.log('✅ 数据库表创建完成');
  }

  // 用户相关操作
  async createUser(userData: any): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');

      const user = {
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const request = store.add(user);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async findUserByUsername(username: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const index = store.index('username');

      const request = index.get(username);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async findUserByToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const index = store.index('token');

      const request = index.get(token);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllUsers(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async updateUser(id: number, userData: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');

      const user = {
        ...userData,
        id,
        updated_at: new Date().toISOString()
      };

      const request = store.put(user);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteUser(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 游戏应用相关操作
  async createGame(gameData: any): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction(['games'], 'readwrite');
      const store = transaction.objectStore('games');

      const game = {
        ...gameData,
        validated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const request = store.add(game);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getGamesByOwner(ownerId: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction(['games'], 'readonly');
      const store = transaction.objectStore('games');
      const index = store.index('owner_id');

      const request = index.getAll(ownerId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllGames(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction(['games'], 'readonly');
      const store = transaction.objectStore('games');

      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async findGameByAppId(appid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction(['games'], 'readonly');
      const store = transaction.objectStore('games');
      const index = store.index('appid');

      const request = index.get(appid);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async updateGame(id: number, gameData: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction(['games'], 'readwrite');
      const store = transaction.objectStore('games');

      const game = {
        ...gameData,
        id,
        updated_at: new Date().toISOString()
      };

      const request = store.put(game);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteGame(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction(['games'], 'readwrite');
      const store = transaction.objectStore('games');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // eCPM数据相关操作
  async saveEcpmData(data: any): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction(['ecpm_data'], 'readwrite');
      const store = transaction.objectStore('ecpm_data');

      const ecpmRecord = {
        ...data,
        created_at: new Date().toISOString()
      };

      const request = store.add(ecpmRecord);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getEcpmDataByGame(gameId: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction(['ecpm_data'], 'readonly');
      const store = transaction.objectStore('ecpm_data');
      const index = store.index('game_id');

      const request = index.getAll(gameId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getEcpmDataByDateRange(gameId: number, startDate: string, endDate: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction(['ecpm_data'], 'readonly');
      const store = transaction.objectStore('ecpm_data');

      // 获取所有数据然后过滤（IndexedDB不支持复杂查询）
      const request = store.getAll();

      request.onsuccess = () => {
        const allData = request.result || [];
        const filteredData = allData.filter(item => {
          return item.game_id === gameId &&
                 item.event_time >= startDate &&
                 item.event_time <= endDate;
        }).sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime());

        resolve(filteredData);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllEcpmData(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction(['ecpm_data'], 'readonly');
      const store = transaction.objectStore('ecpm_data');

      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteEcpmDataByGame(gameId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.db.transaction(['ecpm_data'], 'readwrite');
      const store = transaction.objectStore('ecpm_data');
      const index = store.index('game_id');

      const request = index.openCursor(IDBKeyRange.only(gameId));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// 导出单例实例
export const dbManager = new DatabaseManager();

// 初始化数据库
export async function initDatabase(): Promise<void> {
  await dbManager.init();
  console.log('✅ 数据库初始化完成');
}

// 便捷的数据库操作函数
export const db = {
  users: {
    create: (data: any) => dbManager.createUser(data),
    findByUsername: (username: string) => dbManager.findUserByUsername(username),
    findByToken: (token: string) => dbManager.findUserByToken(token),
    getAll: () => dbManager.getAllUsers(),
    update: (id: number, data: any) => dbManager.updateUser(id, data),
    delete: (id: number) => dbManager.deleteUser(id),
  },
  games: {
    create: (data: any) => dbManager.createGame(data),
    getByOwner: (ownerId: number) => dbManager.getGamesByOwner(ownerId),
    getAll: () => dbManager.getAllGames(),
    findByAppId: (appid: string) => dbManager.findGameByAppId(appid),
    update: (id: number, data: any) => dbManager.updateGame(id, data),
    delete: (id: number) => dbManager.deleteGame(id),
  },
  ecpm: {
    save: (data: any) => dbManager.saveEcpmData(data),
    getByGame: (gameId: number) => dbManager.getEcpmDataByGame(gameId),
    getByDateRange: (gameId: number, startDate: string, endDate: string) => dbManager.getEcpmDataByDateRange(gameId, startDate, endDate),
    getAll: () => dbManager.getAllEcpmData(),
    deleteByGame: (gameId: number) => dbManager.deleteEcpmDataByGame(gameId),
  },
};