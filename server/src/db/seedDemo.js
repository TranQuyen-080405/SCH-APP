import { hashPassword } from "../services/password.js";

export const DEMO_EMAIL = "user@example.com";
const DEMO_PASSWORD = "12345678";

function atVietnam(day, hour, minute) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${day}T${hh}:${mm}:00+07:00`).toISOString();
}

// Mốc "hôm nay" của bộ dữ liệu thử: 2026-11-04 (giờ Việt Nam).
const TASKS = [
  {
    id: 9101,
    title: "Gửi báo cáo tuần cho anh Minh",
    description: "Tổng hợp số liệu tuần rồi gửi trước giờ họp.",
    deadline: "2026-10-16",
    priority: "high",
    status: "done",
    createdAt: atVietnam("2026-10-14", 9, 0),
    completedAt: atVietnam("2026-10-16", 9, 20),
    outcomeNote: "Đã gửi đúng hạn, anh Minh không góp ý thêm.",
    outcomeRating: "met",
  },
  {
    id: 9102,
    title: "Họp giao ban đầu tuần",
    description: "Đi qua việc tồn và chốt người làm báo cáo.",
    deadline: "2026-10-20",
    priority: "medium",
    status: "done",
    createdAt: atVietnam("2026-10-19", 16, 0),
    completedAt: atVietnam("2026-10-20", 8, 30),
    outcomeNote: "Chốt được việc của tuần.",
    outcomeRating: "good",
  },
  {
    id: 9103,
    title: "Mua đồ dùng văn phòng",
    description: "Bút, giấy in và giấy ghi chú cho cả tổ.",
    deadline: "2026-10-22",
    priority: "low",
    status: "done",
    createdAt: atVietnam("2026-10-21", 11, 0),
    completedAt: atVietnam("2026-10-22", 17, 10),
    outcomeNote: "Mua đủ, còn dư một tập giấy.",
    outcomeRating: "met",
  },
  {
    id: 9104,
    title: "Hoàn thành slide họp khách hàng",
    description: "Rút phần số liệu tháng 10, bỏ slide thừa.",
    deadline: "2026-10-30",
    priority: "high",
    status: "done",
    createdAt: atVietnam("2026-10-28", 14, 0),
    completedAt: atVietnam("2026-10-30", 16, 0),
    outcomeNote: "Khách hỏi đúng phần doanh thu, đã trả lời được.",
    outcomeRating: "good",
  },
  {
    id: 9105,
    title: "Gọi điện xác nhận lịch với chị Hà",
    description: "Nhắc cuộc hẹn thứ hai tuần sau.",
    deadline: "2026-10-31",
    priority: "medium",
    status: "done",
    createdAt: atVietnam("2026-10-30", 9, 30),
    completedAt: atVietnam("2026-10-31", 10, 15),
    outcomeNote: "Chị Hà giữ lịch 9 giờ sáng.",
    outcomeRating: "met",
  },
  {
    id: 9106,
    title: "Nộp báo cáo tiến độ tháng 10",
    description: "Gửi file cho phòng kế hoạch trước trưa.",
    deadline: "2026-11-01",
    priority: "high",
    status: "done",
    createdAt: atVietnam("2026-10-29", 8, 40),
    completedAt: atVietnam("2026-11-01", 11, 40),
    outcomeNote: "Nộp trước hạn nửa ngày.",
    outcomeRating: "good",
  },
  {
    id: 9107,
    title: "Ôn bài chương 3 môn xác suất",
    description: "Làm lại bài tập biến ngẫu nhiên.",
    deadline: "2026-11-02",
    priority: "medium",
    status: "done",
    createdAt: atVietnam("2026-11-01", 19, 0),
    completedAt: atVietnam("2026-11-02", 21, 10),
    outcomeNote: "Làm bài tập còn chậm.",
    outcomeRating: "improve",
  },
  {
    id: 9108,
    title: "Mua rau và sữa cho cả tuần",
    description: "Ghé chợ sau giờ làm.",
    deadline: "2026-11-03",
    priority: "low",
    status: "done",
    createdAt: atVietnam("2026-11-03", 8, 0),
    completedAt: atVietnam("2026-11-03", 18, 20),
    outcomeNote: "Mua đủ phần ăn đến chủ nhật.",
    outcomeRating: "met",
  },
  {
    id: 9109,
    title: "Soạn biên bản họp sáng",
    description: "Ghi quyết định và người phụ trách.",
    deadline: "2026-11-04",
    priority: "medium",
    status: "done",
    createdAt: atVietnam("2026-11-04", 7, 30),
    completedAt: atVietnam("2026-11-04", 8, 40),
    outcomeNote: "Gửi biên bản trong nhóm trước 9 giờ.",
    outcomeRating: "good",
  },
  {
    id: 9110,
    title: "Gọi điện nhắc nhà cung cấp",
    description: "Họ hẹn giao hàng từ tuần trước, chưa thấy.",
    deadline: "2026-10-28",
    priority: "high",
    status: "doing",
    createdAt: atVietnam("2026-10-24", 10, 0),
    completedAt: null,
    outcomeNote: null,
    outcomeRating: null,
  },
  {
    id: 9111,
    title: "Sửa báo cáo chi phí quý 3",
    description: "Số liệu phòng kế toán chưa khớp.",
    deadline: "2026-11-02",
    priority: "high",
    status: "todo",
    createdAt: atVietnam("2026-10-27", 15, 0),
    completedAt: null,
    outcomeNote: null,
    outcomeRating: null,
  },
  {
    id: 9112,
    title: "Học lại phần SQL join",
    description: "Xem lại bài tập nối bảng đơn hàng.",
    deadline: "2026-11-01",
    priority: "medium",
    status: "doing",
    createdAt: atVietnam("2026-10-30", 20, 0),
    completedAt: null,
    outcomeNote: null,
    outcomeRating: null,
  },
  {
    id: 9113,
    title: "Họp nhóm sản phẩm",
    description: "14 giờ, xem lại backlog trước khi vào.",
    deadline: "2026-11-04",
    priority: "high",
    status: "doing",
    createdAt: atVietnam("2026-11-03", 17, 0),
    completedAt: null,
    outcomeNote: null,
    outcomeRating: null,
  },
  {
    id: 9114,
    title: "Mua quà sinh nhật mẹ",
    description: "Ghé hiệu sách, chọn một cuốn mẹ đang đọc dở.",
    deadline: "2026-11-06",
    priority: "medium",
    status: "todo",
    createdAt: atVietnam("2026-11-02", 12, 0),
    completedAt: null,
    outcomeNote: null,
    outcomeRating: null,
  },
  {
    id: 9115,
    title: "Gửi báo cáo giữa tháng",
    description: "Phần tiến độ và phần còn kẹt.",
    deadline: "2026-11-12",
    priority: "high",
    status: "todo",
    createdAt: atVietnam("2026-11-04", 9, 0),
    completedAt: null,
    outcomeNote: null,
    outcomeRating: null,
  },
  {
    id: 9116,
    title: "Ôn thi giữa kỳ môn kinh tế",
    description: "Đọc lại chương cung cầu và làm đề cũ.",
    deadline: "2026-11-18",
    priority: "medium",
    status: "doing",
    createdAt: atVietnam("2026-11-04", 6, 30),
    completedAt: null,
    outcomeNote: null,
    outcomeRating: null,
  },
  {
    id: 9117,
    title: "Gọi điện cho khách hàng miền Nam",
    description: "Hỏi lại lịch giao quý tới.",
    deadline: "2026-11-20",
    priority: "medium",
    status: "todo",
    createdAt: atVietnam("2026-11-03", 11, 20),
    completedAt: null,
    outcomeNote: null,
    outcomeRating: null,
  },
  {
    id: 9118,
    title: "Họp tổng kết tuần",
    description: "Chuẩn bị ba việc đã xong và hai việc trễ.",
    deadline: "2026-11-25",
    priority: "low",
    status: "todo",
    createdAt: atVietnam("2026-11-04", 10, 0),
    completedAt: null,
    outcomeNote: null,
    outcomeRating: null,
  },
];

const NOTES = [
  {
    id: 9201,
    title: "Tóm tắt sách đang đọc",
    content: "Chương về thói quen: làm việc khó vào buổi sáng, để việc lặt vặt sau giờ ăn trưa.",
    notedOn: "2026-10-12",
  },
  {
    id: 9202,
    title: "Sau buổi họp giao ban",
    content: "Anh Minh muốn báo cáo ngắn hơn. Việc nhà cung cấp để mình gọi, không đẩy sang kế toán.",
    notedOn: "2026-10-18",
  },
  {
    id: 9203,
    title: "Ý cho báo cáo tháng",
    content: "Mở bằng việc đã xong, rồi mới đến phần trễ. Đừng nhét quá nhiều bảng số.",
    notedOn: "2026-10-24",
  },
  {
    id: 9204,
    title: "Nhớ khi gọi nhà cung cấp",
    content: "Hỏi số vận đơn và ngày xe xuất bến. Nếu quá thứ sáu thì xin lịch khác.",
    notedOn: "2026-10-29",
  },
  {
    id: 9205,
    title: "Nhật ký học tối",
    content: "Xác suất chương 3: hiểu kỳ vọng, còn kẹt bài có điều kiện. Mai làm lại đề 4.",
    notedOn: "2026-11-01",
  },
  {
    id: 9206,
    title: "Danh sách mua đồ",
    content: "Rau muống, cà chua, sữa không đường, trứng. Quà mẹ để cuối tuần.",
    notedOn: "2026-11-02",
  },
  {
    id: 9207,
    title: "Điều chưa nói trong họp",
    content: "Slide khách hàng ổn, nhưng phần chi phí quý 3 vẫn lệch. Nói riêng với kế toán ngày mai.",
    notedOn: "2026-11-03",
  },
  {
    id: 9208,
    title: "Ghi chú sáng nay",
    content: "Họp sản phẩm lúc 14 giờ. Trước đó gửi biên bản buổi sáng và xem backlog.",
    notedOn: "2026-11-04",
  },
];

export const DEMO_TASK_COUNT = TASKS.length;
export const DEMO_NOTE_COUNT = NOTES.length;

export async function seedDemo(db) {
  let user = db.prepare("SELECT id FROM users WHERE email = ?").get(DEMO_EMAIL);
  if (!user) {
    const passwordHash = await hashPassword(DEMO_PASSWORD);
    try {
      user = db
        .prepare(
          "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?) RETURNING id",
        )
        .get(DEMO_EMAIL, passwordHash, atVietnam("2026-10-08", 8, 0));
    } catch (err) {
      if (err.code !== "SQLITE_CONSTRAINT_UNIQUE") throw err;
      user = db.prepare("SELECT id FROM users WHERE email = ?").get(DEMO_EMAIL);
    }
  }

  const taskTaken = db.prepare(
    "SELECT 1 AS ok FROM tasks WHERE id = ? OR (user_id = ? AND title = ?)",
  );
  const insertTask = db.prepare(
    `INSERT INTO tasks (
       id, user_id, title, description, deadline, priority, status,
       created_at, completed_at, outcome_note, outcome_rating
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const noteTaken = db.prepare(
    "SELECT 1 AS ok FROM notes WHERE id = ? OR (user_id = ? AND title = ? AND noted_on = ?)",
  );
  const insertNote = db.prepare(
    `INSERT INTO notes (id, user_id, title, content, noted_on, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );

  const apply = db.transaction((userId) => {
    for (const task of TASKS) {
      if (taskTaken.get(task.id, userId, task.title)) continue;
      insertTask.run(
        task.id,
        userId,
        task.title,
        task.description,
        task.deadline,
        task.priority,
        task.status,
        task.createdAt,
        task.completedAt,
        task.outcomeNote,
        task.outcomeRating,
      );
    }
    for (const note of NOTES) {
      const stamp = atVietnam(note.notedOn, 21, 0);
      if (noteTaken.get(note.id, userId, note.title, note.notedOn)) continue;
      insertNote.run(note.id, userId, note.title, note.content, note.notedOn, stamp, stamp);
    }
  });
  apply(user.id);
}
