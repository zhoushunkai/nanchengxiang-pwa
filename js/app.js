/* ============================================
   app.js - 南城香协作终端
   Supabase 云端数据 + 前端路由
   ============================================ */

/* ---------------- Supabase 配置（部署时替换） ---------------- */
const SUPABASE_URL = 'https://omkshuposrdmwgukpoxd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ta3NodXBvc3JkbXdndWtwb3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NTM2NTcsImV4cCI6MjEwMTEyOTY1N30.WH7ta72Bm2cICuQhW--O26BftF1FJZtN3WNwOddfQO4';

const App = {
  supabase: null,
  currentUser: null,
  currentHash: '',
  dataCache: {},       // 内存缓存，页面同步读取
  dataReady: false,    // 缓存是否就绪

  /* ---- 种子数据（首次初始化用，camelCase 兼容旧代码） ---- */
  // daily_reports: [{ id, inspector, date, type('online'|'offline'), items: [{ store, score, findings }] }]
  seedData: {
    daily_reports: [],
    stores: [
      { id: 'FZ001', name: '方庄店', district: '朝阳区', adminArea: '朝阳区', bizArea: '经营一区', region: '经营一区', manager: '张三', managerTitle: '门店第一负责人', mode: '2.0' },
      { id: 'WJ001', name: '望京店', district: '朝阳区', adminArea: '朝阳区', bizArea: '经营一区', region: '经营一区', manager: '李四', managerTitle: '门店第一负责人', mode: '2.5' },
      { id: 'SLH001', name: '十里河店', district: '朝阳区', adminArea: '朝阳区', bizArea: '经营二区', region: '经营二区', manager: '王五', managerTitle: '门店第一负责人', mode: '2.0' },
      { id: 'SH001', name: '上海徐汇店', district: '上海', adminArea: '上海', bizArea: '上海', region: '上海', manager: '赵六', managerTitle: '门店第一负责人', mode: '3.0' },
      { id: 'HD001', name: '海淀黄庄店', district: '海淀区', adminArea: '海淀区', bizArea: '经营三区', region: '经营三区', manager: '孙七', managerTitle: '门店第一负责人', mode: '2.0' },
      { id: 'DC001', name: '东城王府井店', district: '东城区', adminArea: '东城区', bizArea: '经营一区', region: '经营一区', manager: '周八', managerTitle: '储备店长', mode: '2.5' },
      { id: 'FT001', name: '丰台科技园店', district: '丰台区', adminArea: '丰台区', bizArea: '经营二区', region: '经营二区', manager: '吴九', managerTitle: '门店第一负责人', mode: '2.0' },
      { id: 'SH002', name: '上海浦东店', district: '上海', adminArea: '上海', bizArea: '上海', region: '上海', manager: '郑十', managerTitle: '储备店长', mode: '3.0' }
    ],
    users: [
      { id: 'u001', name: '管理员', role: '总部', area: '', storeId: '', store: '', phone: '13800000001' },
      { id: 'u002', name: '刘畅', role: '线上稽核', area: '', storeId: '', store: '', phone: '13800000002' },
      { id: 'u003', name: '马昕茹', role: '线上稽核', area: '', storeId: '', store: '', phone: '13800000003' },
      { id: 'u004', name: '陶畅', role: '线上稽核', area: '', storeId: '', store: '', phone: '13800000004' },
      { id: 'u005', name: '范晓明', role: '线下稽核', area: '', storeId: '', store: '', phone: '13800000005' },
      { id: 'u006', name: '钱磊', role: '线下稽核', area: '', storeId: '', store: '', phone: '13800000006' },
      { id: 'u007', name: '教练A', role: '区域教练', area: '经营一区', storeId: '', store: '', phone: '13800000007' },
      { id: 'u008', name: '教练B', role: '区域教练', area: '上海', storeId: '', store: '', phone: '13800000008' },
      { id: 'u009', name: '张三', role: '店长', area: '', storeId: 'FZ001', store: '方庄店', phone: '13800000009' },
      { id: 'u010', name: '李四', role: '店长', area: '', storeId: 'WJ001', store: '望京店', phone: '13800000010' },
      { id: 'u011', name: '王五', role: '店长', area: '', storeId: 'SLH001', store: '十里河店', phone: '13800000011' },
      { id: 'u012', name: '赵六', role: '店长', area: '', storeId: 'SH001', store: '上海徐汇店', phone: '13800000012' },
      { id: 'u013', name: '孙七', role: '店长', area: '', storeId: 'HD001', store: '海淀黄庄店', phone: '13800000013' },
      { id: 'u014', name: '周八', role: '店长', area: '', storeId: 'DC001', store: '东城王府井店', phone: '13800000014' }
    ],
    region_coaches: [
      { region: '经营一区', coach: '教练A', storeCount: 3 },
      { region: '经营二区', coach: '教练B', storeCount: 2 },
      { region: '经营三区', coach: '教练C', storeCount: 1 },
      { region: '上海', coach: '教练B', storeCount: 2 }
    ],
    penalties: [
      { id: 'p001', storeId: 'FZ001', store: '方庄店', region: '经营一区', district: '朝阳区', manager: '张三', eventDate: '2026-08-03', event: '未及时上传日清记录', category: '管理失职', level: '一级批评教育', source: '现场稽核', inspector: '范晓明', personName: '张三', personLevel: '一级批评教育', personType: '管理失职', penaltyPerson: '', penaltyManager: '', survey: '经查，门店未及时上传7月28日日清记录', suggestion: '通报批评，限期整改', policyRef: '新奖惩制度第3.1条', dutyPerson: '', dutyManager: '', dutyValue: '', dutyCoach: '', status: '待补填' },
      { id: 'p002', storeId: 'WJ001', store: '望京店', region: '经营一区', district: '朝阳区', manager: '李四', eventDate: '2026-08-05', event: '外卖平台差评未回复', category: '运营类', level: '二级书面警告', source: '线上差评', inspector: '刘畅', personName: '李四', personLevel: '二级书面警告', personType: '运营类', penaltyPerson: '200', penaltyManager: '100', survey: '顾客在外卖平台投诉卫生问题，门店未及时回复', suggestion: '书面警告，罚款200元', policyRef: '新奖惩制度第5.2条', dutyPerson: '李四', dutyManager: '李四', dutyValue: '200', dutyCoach: '', status: '已闭环' },
      { id: 'p003', storeId: 'SLH001', store: '十里河店', region: '经营二区', district: '朝阳区', manager: '王五', eventDate: '2026-08-10', event: '食品过期未下架', category: '食品安全', level: '三级降职降薪', source: '线下稽核', inspector: '钱磊', personName: '王五', personLevel: '三级降职降薪', personType: '食品安全', penaltyPerson: '取消当月奖金', penaltyManager: '取消当月奖金', survey: '巡检发现冷藏柜中有过期食材未及时处理', suggestion: '降职降薪，取消当月奖金', policyRef: '新奖惩制度第8.1条', dutyPerson: '王五', dutyManager: '王五', dutyValue: '取消当月奖金', dutyCoach: '教练A', status: '已闭环' },
      { id: 'p004', storeId: 'SH001', store: '上海徐汇店', region: '上海', district: '上海', manager: '赵六', eventDate: '2026-08-12', event: '员工旷工', category: '纪律类', level: '经济处罚', source: '店长上报', inspector: '赵六', personName: '员工A', personLevel: '经济处罚', personType: '纪律类', penaltyPerson: '100', penaltyManager: '', survey: '员工未经请假擅自离岗', suggestion: '经济处罚100元', policyRef: '新奖惩制度第1.2条', dutyPerson: '', dutyManager: '', dutyValue: '', dutyCoach: '', status: '超时' }
    ],
    complaints: [
      { id: 'c001', storeId: 'FZ001', store: '方庄店', date: '2026-08-01', meal: '午餐', content: '菜品太咸，服务态度差', opportunity: '口味标准化/服务培训', platform: '点评', responsible: '张三', responsibleTitle: '店长', dutyManager: '张三', status: '待处理', appealContent: '', appealResult: '' },
      { id: 'c002', storeId: 'WJ001', store: '望京店', date: '2026-08-03', meal: '晚餐', content: '等了40分钟才上菜', opportunity: '出餐速度优化', platform: '公众号', responsible: '李四', responsibleTitle: '店长', dutyManager: '李四', status: '待处理', appealContent: '', appealResult: '' },
      { id: 'c003', storeId: 'SLH001', store: '十里河店', date: '2026-08-05', meal: '早餐', content: '豆浆有异味', opportunity: '食品安全检查', platform: '点评', responsible: '王五', responsibleTitle: '店长', dutyManager: '王五', status: '已处理', appealContent: '', appealResult: '' },
      { id: 'c004', storeId: 'SH001', store: '上海徐汇店', date: '2026-08-07', meal: '午餐', content: '餐具不干净', opportunity: '清洗流程规范', platform: '点评', responsible: '赵六', responsibleTitle: '店长', dutyManager: '赵六', status: '待处理', appealContent: '', appealResult: '' },
      { id: 'c005', storeId: 'FZ001', store: '方庄店', date: '2026-08-08', meal: '晚餐', content: '外卖漏送菜品', opportunity: '外卖打包流程', platform: '点评', responsible: '打包员', responsibleTitle: '小时工', dutyManager: '张三', status: '已驳回', appealContent: '员工操作失误已处罚', appealResult: '驳回' }
    ],
    onlineRecords: [
      { id: 'o001', inspector: '刘畅', storeId: 'FZ001', store: '方庄店', date: '2026-08-01', content: '顾客差评：菜品味道偏咸' },
      { id: 'o002', inspector: '刘畅', storeId: 'WJ001', store: '望京店', date: '2026-08-02', content: '投诉出餐速度慢' }
    ],
    offlineRecords: [
      { id: 'of001', inspector: '范晓明', storeId: 'FZ001', store: '方庄店', date: '2026-08-03', score: 85, content: '后厨卫生扣5分；食材存放扣10分' },
      { id: 'of002', inspector: '钱磊', storeId: 'SLH001', store: '十里河店', date: '2026-08-06', score: 72, content: '食品过期扣15分；服务态度扣8分；环境扣5分' }
    ]
  },

  /* ---- 字段名转换工具（camelCase ↔ snake_case） ---- */
  _toSnake(str) {
    return str.replace(/[A-Z]/g, function(m) { return '_' + m.toLowerCase(); });
  },
  _toCamel(str) {
    return str.replace(/_([a-z])/g, function(m, c) { return c.toUpperCase(); });
  },
  _camelRow(row) {
    if (!row) return row;
    var out = {};
    for (var k in row) {
      if (row.hasOwnProperty(k)) out[this._toCamel(k)] = row[k];
    }
    return out;
  },
  _snakeRow(row) {
    if (!row) return row;
    var out = {};
    for (var k in row) {
      if (row.hasOwnProperty(k)) out[this._toSnake(k)] = row[k];
    }
    return out;
  },
  _camelList(list) {
    var self = this;
    return list.map(function(r) { return self._camelRow(r); });
  },
  _snakeList(list) {
    var self = this;
    return list.map(function(r) { return self._snakeRow(r); });
  },

  /* ---- 表名映射 ---- */
  tables: ['stores', 'users', 'region_coaches', 'penalties', 'complaints', 'online_records', 'offline_records', 'daily_reports'],

  /* ==================== 初始化 ==================== */
  async init() {
    // 初始化 Supabase 客户端
    if (typeof supabase !== 'undefined') {
      this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    await this.initData();
    this.bindHashChange();
    this.bindTabBar();
    this.checkLogin();
  },

  /* 首次使用种子数据到 Supabase；已有数据则直接加载 */
  async initData() {
    if (!this.supabase) {
      this.initLocalFallback();
      return;
    }

    try {
      var { count } = await this.supabase.from('stores').select('*', { count: 'exact', head: true });
      if (count === 0) {
        for (var t = 0; t < this.tables.length; t++) {
          var table = this.tables[t];
          if (this.seedData[table] && this.seedData[table].length > 0) {
            // 写入 Supabase 时转 snake_case
            await this.supabase.from(table).insert(this._snakeList(this.seedData[table]));
          }
        }
        console.log('[Supabase] 种子数据初始化完成');
      }
      await this.loadAll();
      this.dataReady = true;
    } catch (e) {
      console.warn('[Supabase] 连接失败，回退 localStorage:', e.message);
      this.initLocalFallback();
    }
  },

  /* Supabase 不可用时回退 localStorage */
  initLocalFallback() {
    if (!localStorage.getItem('nanchengxiang_stores')) {
      localStorage.setItem('nanchengxiang_stores', JSON.stringify(this.seedData.stores));
      localStorage.setItem('nanchengxiang_users', JSON.stringify(this.seedData.users));
      localStorage.setItem('nanchengxiang_region_coaches', JSON.stringify(this.seedData.region_coaches));
      localStorage.setItem('nanchengxiang_penalties', JSON.stringify(this.seedData.penalties));
      localStorage.setItem('nanchengxiang_complaints', JSON.stringify(this.seedData.complaints));
      localStorage.setItem('nanchengxiang_online_records', JSON.stringify(this.seedData.online_records));
      localStorage.setItem('nanchengxiang_offline_records', JSON.stringify(this.seedData.offline_records));
      localStorage.setItem('nanchengxiang_daily_reports', JSON.stringify(this.seedData.daily_reports));
    }
    this.dataCache.stores = JSON.parse(localStorage.getItem('nanchengxiang_stores') || '[]');
    this.dataCache.users = JSON.parse(localStorage.getItem('nanchengxiang_users') || '[]');
    this.dataCache.region_coaches = JSON.parse(localStorage.getItem('nanchengxiang_region_coaches') || '[]');
    this.dataCache.penalties = JSON.parse(localStorage.getItem('nanchengxiang_penalties') || '[]');
    this.dataCache.complaints = JSON.parse(localStorage.getItem('nanchengxiang_complaints') || '[]');
    this.dataCache.online_records = JSON.parse(localStorage.getItem('nanchengxiang_online_records') || '[]');
    this.dataCache.offline_records = JSON.parse(localStorage.getItem('nanchengxiang_offline_records') || '[]');
    this.dataCache.daily_reports = JSON.parse(localStorage.getItem('nanchengxiang_daily_reports') || '[]');
    this.dataCache.notices = JSON.parse(localStorage.getItem('nanchengxiang_notices') || '[]');
    this.dataReady = true;
  },

  /* 从 Supabase 加载全部数据到缓存 */
  async loadAll() {
    var tasks = [];
    for (var t = 0; t < this.tables.length; t++) {
      tasks.push(this._loadTable(this.tables[t]));
    }
    await Promise.all(tasks);
    this.dataReady = true;
  },

  async _loadTable(table) {
    var allRows = [];
    var from = 0;
    var limit = 1000;
    while (true) {
      var { data, error } = await this.supabase.from(table).select('*').range(from, from + limit - 1);
      if (error) { console.error('[Supabase] load ' + table + ':', error.message); break; }
      if (!data || data.length === 0) break;
      // Supabase 返回 snake_case，转 camelCase 存入缓存
      allRows = allRows.concat(this._camelList(data));
      if (data.length < limit) break;
      from += limit;
    }
    this.dataCache[table] = allRows;
  },

  /* 页面切换时刷新缓存（获取最新数据） */
  async refreshData() {
    if (this.supabase && this.dataReady) {
      try {
        await this.loadAll();
      } catch (e) { /* 保持旧缓存 */ }
    }
  },

  /* ==================== 数据存取（兼容旧接口） ==================== */
  getStores()          { return this.dataCache.stores || []; },
  getUsers()           { return this.dataCache.users || []; },
  getPenalties()       { return this.dataCache.penalties || []; },
  getComplaints()      { return this.dataCache.complaints || []; },
  getOnlineRecords()   { return this.dataCache.online_records || []; },
  getOfflineRecords()  { return this.dataCache.offline_records || []; },
  getRegionCoaches()   { return this.dataCache.region_coaches || []; },
  getDailyReports()   { return this.dataCache.daily_reports || []; },

  async saveDailyReports(data) {
    this.dataCache.daily_reports = data;
    if (this.supabase) {
      await this.supabase.from('daily_reports').delete().neq('id', '__none__');
      if (data.length > 0) await this.supabase.from('daily_reports').insert(this._snakeList(data));
    } else {
      localStorage.setItem('nanchengxiang_daily_reports', JSON.stringify(data));
    }
  },

  async savePenalties(data) {
    this.dataCache.penalties = data;
    if (this.supabase) {
      await this.supabase.from('penalties').delete().neq('id', '__none__');
      if (data.length > 0) await this.supabase.from('penalties').insert(this._snakeList(data));
    } else {
      localStorage.setItem('nanchengxiang_penalties', JSON.stringify(data));
    }
  },
  async saveComplaints(data) {
    this.dataCache.complaints = data;
    if (this.supabase) {
      await this.supabase.from('complaints').delete().neq('id', '__none__');
      if (data.length > 0) await this.supabase.from('complaints').insert(this._snakeList(data));
    } else {
      localStorage.setItem('nanchengxiang_complaints', JSON.stringify(data));
    }
  },
  async saveOnlineRecords(data) {
    this.dataCache.online_records = data;
    if (this.supabase) {
      await this.supabase.from('online_records').delete().neq('id', '__none__');
      if (data.length > 0) await this.supabase.from('online_records').insert(this._snakeList(data));
    } else {
      localStorage.setItem('nanchengxiang_online_records', JSON.stringify(data));
    }
  },
  async saveOfflineRecords(data) {
    this.dataCache.offline_records = data;
    if (this.supabase) {
      await this.supabase.from('offline_records').delete().neq('id', '__none__');
      if (data.length > 0) await this.supabase.from('offline_records').insert(this._snakeList(data));
    } else {
      localStorage.setItem('nanchengxiang_offline_records', JSON.stringify(data));
    }
  },
  async saveUsers(data) {
    this.dataCache.users = data;
    if (this.supabase) {
      await this.supabase.from('users').delete().neq('id', '__none__');
      if (data.length > 0) await this.supabase.from('users').insert(this._snakeList(data));
    } else {
      localStorage.setItem('nanchengxiang_users', JSON.stringify(data));
    }
  },

  /* 单用户增删改 */
  async addUser(user) {
    var users = this.getUsers();
    user.id = user.id || 'u' + Date.now();
    users.push(user);
    await this.saveUsers(users);
    this.toast(user.name + ' 已添加');
  },
  async updateUser(id, updates) {
    var users = this.getUsers();
    var idx = users.findIndex(function(u) { return u.id === id; });
    if (idx === -1) return;
    for (var k in updates) { if (updates.hasOwnProperty(k)) users[idx][k] = updates[k]; }
    await this.saveUsers(users);
    this.toast((updates.name || '用户') + ' 已更新');
  },
  async deleteUser(id) {
    var users = this.getUsers();
    var user = users.find(function(u) { return u.id === id; });
    if (!user) return;
    var name = user.name;
    var filtered = users.filter(function(u) { return u.id !== id; });
    await this.saveUsers(filtered);
    this.toast(name + ' 已删除');
  },
  async saveStores(data) {
    this.dataCache.stores = data;
    if (this.supabase) {
      await this.supabase.from('stores').delete().neq('id', '__none__');
      if (data.length > 0) await this.supabase.from('stores').insert(this._snakeList(data));
    } else {
      localStorage.setItem('nanchengxiang_stores', JSON.stringify(data));
    }
  },

  /* ==================== 路由 ==================== */
  bindHashChange() {
    window.addEventListener('hashchange', () => this.route());
    this.route();
  },

  async route() {
    var hash = location.hash.replace('#', '') || 'login';
    this.currentHash = hash;

    if (!this.currentUser && hash !== 'login') {
      location.hash = '#login';
      return;
    }

    // 页面切换时刷新数据
    if (hash !== 'login') {
      await this.refreshData();
    }

    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });

    var page = document.getElementById('page-' + hash);
    if (page) {
      page.classList.add('active');
      if (typeof Pages !== 'undefined' && Pages[hash]) {
        Pages[hash]();
      }
    }

    var tabPages = ['home', 'inspection', 'penalty', 'complaint', 'dashboard', 'template', 'daily'];
    document.querySelectorAll('.tab-item').forEach(function(t) {
      t.classList.toggle('active', t.dataset.page === hash);
    });

    var tabbar = document.getElementById('tabbar');
    tabbar.style.display = (hash === 'login' || hash === 'offline-inspect' || hash === 'admin') ? 'none' : 'flex';

    var titleMap = {
      login: '南城香协作终端', home: '首页', inspection: '门店检查', 'offline-inspect': '线下门店检查',
      penalty: '处罚登记', complaint: '差评申诉', dashboard: '领导看板', template: '通知模板', admin: '数据管理',
      daily: '稽核日报'
    };
    document.getElementById('header-title').textContent = titleMap[hash] || '';
    document.getElementById('header-back').style.display = (hash === 'offline-inspect' || hash === 'login') ? 'none' : 'none';
  },

  bindTabBar() {
    document.querySelectorAll('.tab-item').forEach(function(tab) {
      tab.addEventListener('click', function() {
        location.hash = '#' + tab.dataset.page;
      });
    });
  },

  navigate(page) {
    location.hash = '#' + page;
  },

  /* ==================== 登录 ==================== */
  checkLogin() {
    var saved = localStorage.getItem('nanchengxiang_current_user');
    if (saved) {
      this.currentUser = JSON.parse(saved);
      location.hash = '#home';
    } else {
      location.hash = '#login';
    }
  },

  login(userId) {
    var users = this.getUsers();
    var user = users.find(function(u) { return u.id === userId; });
    if (!user) return false;
    this.currentUser = user;
    localStorage.setItem('nanchengxiang_current_user', JSON.stringify(user));
    return true;
  },

  quickLogin() {
    this.currentUser = { id: 'admin', name: '预览模式', role: 'admin', area: '总部', storeId: '', store: '' };
    localStorage.setItem('nanchengxiang_current_user', JSON.stringify(this.currentUser));
    localStorage.setItem('nanchengxiang_preview_mode', '1');
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('nanchengxiang_current_user');
    location.hash = '#login';
  },

  /* ==================== Toast ==================== */
  toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function() { el.classList.remove('show'); }, 2000);
  },

  /* ==================== CSV 下载模板 ==================== */
  downloadTemplate(type) {
    var headers, sample;
    if (type === 'users') {
      headers = 'id,name,role,area,storeId,store,phone';
      sample = 'u099,测试员工,店长,经营一区,FZ001,方庄店,13800000099';
    } else {
      headers = 'id,name,district,adminArea,bizArea,region,manager,managerTitle,mode';
      sample = 'S099,测试门店,朝阳区,朝阳区,经营一区,经营一区,张三,门店第一负责人,2.0';
    }
    var csv = headers + '\n' + sample;
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = type + '_template.csv';
    a.click();
  },

  /* ==================== CSV 导入 ==================== */
  importCSV(input, type) {
    var self = this;
    var file = input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = async function(e) {
      var text = e.target.result;
      var lines = text.split(/\r?\n/).filter(function(l) { return l.trim(); });
      if (lines.length < 2) { self.toast('CSV 文件为空或缺少表头'); return; }
      var headers = lines[0].split(',').map(function(h) { return h.trim(); });
      var count = 0;
      var dataRows = lines.slice(1);

      if (type === 'users') {
        var users = self.getUsers();
        var existingIds = {};
        users.forEach(function(u) { existingIds[u.id] = true; });
        for (var i = 0; i < dataRows.length; i++) {
          var cols = dataRows[i].split(',');
          var row = {};
          for (var j = 0; j < headers.length; j++) {
            row[headers[j]] = (cols[j] || '').trim();
          }
          if (!row.id || !row.name) continue;
          if (existingIds[row.id]) continue;
          users.push({ id: row.id, name: row.name, role: row.role || '店长', area: row.area || '', storeId: row.storeId || '', store: row.store || '' });
          existingIds[row.id] = true;
          count++;
        }
        await self.saveUsers(users);
      } else if (type === 'stores') {
        var stores = self.getStores();
        var existingStoreIds = {};
        stores.forEach(function(s) { existingStoreIds[s.id] = true; });
        for (var i = 0; i < dataRows.length; i++) {
          var cols = dataRows[i].split(',');
          var row = {};
          for (var j = 0; j < headers.length; j++) {
            row[headers[j]] = (cols[j] || '').trim();
          }
          if (!row.id || !row.name) continue;
          if (existingStoreIds[row.id]) continue;
          stores.push({
            id: row.id, name: row.name, district: row.district || '', adminArea: row.adminArea || '',
            bizArea: row.bizArea || '', region: row.region || '', manager: row.manager || '',
            managerTitle: row.managerTitle || '', mode: row.mode || ''
          });
          existingStoreIds[row.id] = true;
          count++;
        }
        await self.saveStores(stores);
      }
      self.toast('成功导入 ' + count + ' 条数据');
      input.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  },

  /* ==================== CSV 导出 ==================== */
  exportCSV(type) {
    var data, headers;
    if (type === 'penalties') {
      data = this.getPenalties();
      headers = ['id', 'storeId', 'store', 'region', 'district', 'manager', 'eventDate', 'event', 'category', 'level', 'source', 'inspector', 'personName', 'personLevel', 'personType', 'penaltyPerson', 'penaltyManager', 'survey', 'suggestion', 'policyRef', 'dutyPerson', 'dutyManager', 'dutyValue', 'dutyCoach', 'status'];
    } else if (type === 'complaints') {
      data = this.getComplaints();
      headers = ['id', 'storeId', 'store', 'date', 'meal', 'content', 'opportunity', 'platform', 'responsible', 'responsibleTitle', 'dutyManager', 'status', 'appealContent', 'appealResult'];
    } else if (type === 'users') {
      data = this.getUsers();
      headers = ['id', 'name', 'role', 'area', 'storeId', 'store', 'phone'];
    } else if (type === 'daily_reports') {
      data = [];
      var reports = this.getDailyReports();
      reports.forEach(function(r) {
        (r.items || []).forEach(function(item) {
          data.push({
            id: r.id, inspector: r.inspector, date: r.date, type: r.type,
            store: item.store, score: item.score, findings: item.findings
          });
        });
      });
      headers = ['id', 'inspector', 'date', 'type', 'store', 'score', 'findings'];
    } else {
      var stores = this.getStores();
      var penalties = this.getPenalties();
      var complaints = this.getComplaints();
      data = stores.map(function(s) {
        var storePenalties = penalties.filter(function(p) { return p.storeId === s.id; });
        var done = storePenalties.filter(function(p) { return p.status === '已闭环'; }).length;
        var storeComplaints = complaints.filter(function(c) { return c.storeId === s.id; });
        var passed = storeComplaints.filter(function(c) { return c.status === '已申诉' && c.appealResult === '通过'; }).length;
        return {
          storeId: s.id, store: s.name, district: s.district, region: s.region,
          manager: s.manager, mode: s.mode,
          totalPenalties: storePenalties.length, closedPenalties: done,
          totalComplaints: storeComplaints.length, passedAppeals: passed
        };
      });
      headers = ['storeId', 'store', 'district', 'region', 'manager', 'mode', 'totalPenalties', 'closedPenalties', 'totalComplaints', 'passedAppeals'];
    }
    var csv = '\uFEFF' + headers.join(',') + '\n';
    data.forEach(function(row) {
      var vals = headers.map(function(h) {
        var v = (row[h] !== undefined ? row[h] : '').toString();
        if (v.indexOf(',') !== -1 || v.indexOf('"') !== -1 || v.indexOf('\n') !== -1) {
          v = '"' + v.replace(/"/g, '""') + '"';
        }
        return v;
      });
      csv += vals.join(',') + '\n';
    });
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    var now = new Date();
    a.download = type + '_' + now.getFullYear() + ('0'+(now.getMonth()+1)).slice(-2) + ('0'+now.getDate()).slice(-2) + '.csv';
    a.click();
    this.toast('导出成功');
  }
};

/* 启动 */
document.addEventListener('DOMContentLoaded', function() { App.init(); });
