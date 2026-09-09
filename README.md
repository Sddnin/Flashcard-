# FlashEnglish — Flashcard học từ vựng tiếng Anh (A1–C2)

Ứng dụng học từ vựng tiếng Anh bằng flashcard, tích hợp AI (Gemini), luyện tập
đa dạng, chat & gọi thoại với AI. Xây bằng **Next.js 16** (App Router) và yêu
cầu **Node.js 24+**.

## Tính năng

### Tab 1 — Flashcard
- Thêm từ bằng **AI** (Gemini tự tra phiên âm, nghĩa, ví dụ, ước lượng trình
  độ CEFR A1–C2) hoặc **nhập tay**.
- Tìm kiếm từ đã lưu, lọc theo trình độ CEFR.
- Thẻ lật 2 mặt: mặt trước = từ + phiên âm (có thể ẩn/hiện) + loa phát âm;
  mặt sau = nghĩa tiếng Việt + ví dụ.
- **Nói để lật thẻ** (voice command qua micro).
- Nút chuyển thẻ trước/sau.
- **Mini AI lookup**: popup nhỏ tra từ nhanh bất cứ lúc nào, lưu thẳng vào
  Flashcard.

### Tab 2 — Luyện tập
- Nối từ Anh → Việt và Việt → Anh (hai cột không trùng hàng, tránh đoán mò).
- Luyện nói: ghi âm qua micro, chấm điểm độ chính xác phát âm.
- Luyện nghe: nghe từ, chọn đáp án đúng trong 4 lựa chọn.
- Xếp câu: sắp xếp các từ thành câu ví dụ đúng.
- Chế độ **Tổng hợp**: random trộn tất cả các dạng bài trên.

### Tab 3 — AI
- **Chat** văn bản với Gemini (mặc định `gemini-3.5-flash-lite`).
- **Call**: gọi thoại trực tiếp real-time với Gemini Live
  (mặc định `gemini-3.1-flash-live`) — nói chuyện tự nhiên để luyện phản xạ
  nghe nói.
- Có taskbar riêng cho mobile để chuyển tab dễ dàng.

### Tab 4 — Import/Export
- Nhập file JSON (danh sách từ đơn giản hoặc object đầy đủ thông tin); có thể
  bật AI để tự phân tích và bổ sung phiên âm/nghĩa/ví dụ cho từ đơn.
- Xuất dữ liệu ra **JSON / PDF / Word / Excel**.

### Cài đặt
- Quản lý **tối đa 4 Gemini API key**, hệ thống tự động xoay vòng và chuyển
  key khác khi bị rate-limit hoặc lỗi.
- Tuỳ chỉnh tên model chat/live.

### Luồng sử dụng đề xuất
```
Thêm từ / Nhập từ  →  Flashcard  →  Luyện tập
```

## Yêu cầu hệ thống

- **Node.js >= 24.0.0** (bắt buộc, đã khai báo trong `package.json > engines`)
- npm (đi kèm Node)
- Trình duyệt hỗ trợ Web Speech API (Chrome khuyến nghị) để dùng tính năng
  nói/nghe/chấm điểm phát âm.

Kiểm tra phiên bản Node:
```bash
node --version   # phải >= v24.0.0
```
Nếu chưa có Node 24, cài qua [nvm](https://github.com/nvm-sh/nvm):
```bash
nvm install 24
nvm use 24
```

## Cài đặt & chạy

```bash
# 1. Cài dependencies
npm install

# 2. Chạy dev server
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

### Build production
```bash
npm run build
npm run start
```

## Lấy Gemini API Key

1. Vào [Google AI Studio](https://aistudio.google.com/apikey).
2. Đăng nhập bằng tài khoản Google, tạo API key mới (miễn phí, có giới hạn
   request/phút).
3. Copy key, vào tab **Cài đặt** trong app, dán vào 1 trong 4 ô Key.
4. Có thể nhập thêm nhiều key (tối đa 4) để tăng giới hạn tổng — hệ thống sẽ
   tự xoay vòng, key nào bị lỗi/rate-limit sẽ tự "nghỉ" 60 giây rồi mới thử
   lại.

> **Lưu ý bảo mật**: API key được lưu trong `localStorage` của trình duyệt,
> không gửi lên bất kỳ server nào khác ngoài Google. Nếu deploy công khai,
> mỗi người dùng cần tự nhập key riêng của họ.

## Lưu trữ dữ liệu

Toàn bộ flashcard, lịch sử chat, kết quả luyện tập được lưu trong
**IndexedDB** của trình duyệt (qua thư viện Dexie) — không cần backend/
database server. Dữ liệu sẽ mất nếu người dùng xoá dữ liệu trình duyệt; nên
khuyến khích dùng tính năng **Export JSON** ở Tab 4 để sao lưu định kỳ.

## Công nghệ sử dụng

| Thành phần        | Công nghệ                              |
|--------------------|-----------------------------------------|
| Framework          | Next.js 16 (App Router, Turbopack)      |
| Ngôn ngữ           | TypeScript                              |
| Styling            | Tailwind CSS v4                         |
| Icon               | lucide-react                            |
| State cục bộ       | Zustand (persist → localStorage)        |
| Database phía client | Dexie (IndexedDB)                     |
| AI                 | `@google/genai` (Gemini API + Live API) |
| Text-to-Speech     | Web Speech API (`speechSynthesis`)      |
| Speech Recognition | Web Speech API (`SpeechRecognition`)    |
| Xuất PDF           | jsPDF + jspdf-autotable                 |
| Xuất Word          | docx                                    |
| Xuất Excel         | ExcelJS                                 |

## Cấu trúc thư mục

```
src/
├── app/                    # Next.js App Router (layout, page, globals.css)
├── components/
│   ├── flashcard/          # Tab 1: thẻ, form thêm từ, mini AI lookup
│   ├── practice/           # Tab 2: các dạng bài luyện tập
│   ├── ai/                 # Tab 3: chat + call
│   ├── importexport/       # Tab 4: nhập/xuất dữ liệu
│   ├── settings/           # Cài đặt API key & model
│   └── layout/              # Navigation (desktop nav + mobile taskbar)
├── hooks/                   # useFlashcards, useTextToSpeech, useSpeechRecognition, useLiveCall
├── lib/                      # db.ts (Dexie), gemini.ts, liveAudio.ts, settingsStore.ts, exportUtils.ts
└── types/                    # Định nghĩa TypeScript dùng chung
```

## Triển khai (Deploy)

App này là ứng dụng client-side thuần (không cần backend riêng ngoài Next.js
server để render trang), có thể deploy lên:
- **Vercel** (khuyến nghị, tương thích tốt nhất với Next.js): kết nối repo,
  Vercel tự build & deploy.
- Bất kỳ nền tảng nào hỗ trợ Node.js 24+: build bằng `npm run build`, chạy
  bằng `npm run start`.

## Ghi chú về trình duyệt

- Tính năng **nói để lật thẻ**, **luyện nói**, **luyện nghe** cần
  `SpeechRecognition` — hoạt động tốt nhất trên **Chrome** (desktop &
  Android). Safari/Firefox có thể không hỗ trợ đầy đủ.
- Tính năng **gọi thoại AI (Live Call)** cần quyền truy cập micro và kết nối
  WebSocket ổn định tới Gemini Live API.
