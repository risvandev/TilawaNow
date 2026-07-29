# TilawaNow

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel-black?style=flat-square&logo=vercel)](https://tilawanow.vercel.app)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg?style=flat-square)](https://www.gnu.org/licenses/agpl-3.0)
[![Next.js](https://img.shields.io/badge/Framework-Next.js%2014-black?style=flat-square&logo=next.js)](https://nextjs.org/)

**TilawaNow** is a production-grade, open-source Quranic platform built for high-performance reading, analysis, and progress auditing. It integrates modern AI grounding with classical scholarship to provide a distraction-free environment for serious study.

---

## 📸 Preview

![Desktop Reader](https://github.com/risvandev/TilawaNow/raw/main/public/Readme_preview/preview-desktop.png)
*Desktop interface featuring clean typography and AI side-panel.*

![Mobile PWA](https://github.com/risvandev/TilawaNow/raw/main/public/Readme_preview/preview-mobile.png)
*PWA optimized for performance on mobile devices.*

---

## 🎯 What It Is

TilawaNow is a technical solution to a common problem: digital Quran platforms often suffer from feature bloat, intrusive ads, or lack of analytical depth. This project provides:
- A high-fidelity, minimal reader interface.
- Verified grounding for AI-assisted explanations (Tafsir).
- Comprehensive data-driven tracking for reading habits.
- Secure, private-first authentication and data storage.

## 🚀 Core Features

- **AI-Assisted Grounding**: Utilizes Puter.js to provide explanations grounded in verified Tafsir (Ibn Kathir).
- **Audit System**: Real-time tracking of unique Ayahs read, streaks, and total completion stats.
- **Dynamic Reader**: Custom-built reader supporting multiple scripts (Uthmani, IndoPak, Imlaei) and translations.
- **Audio Pipeline**: Multi-reciter audio integration with word-level highlighting and synchronization.
- **PWA Architecture**: Full support for native installation on iOS, Android, and Desktop.
- **Dark Mode Engine**: Premium dark mode and "Night Mode" eye-filter for prolonged usage.

## 🏗️ Architecture

TilawaNow is built with a focus on scalability and maintainability:

- **Frontend**: Next.js 14 (App Router) with React Server Components for optimal SEO and initial load performance.
- **State Management**: Context-based architecture (Auth, UI state) to ensure consistency across the player and reader.
- **AI Pipeline**: Custom service layer integrating **Puter.js** for browser-side LLM interaction and for advanced models.
- **Database**: Supabase PostgreSQL with **Row Level Security (RLS)** ensuring every data point is owned and accessible only by the user.
- **Styling**: Tailwind CSS with a strict design system (Radix UI primitives).

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 |
| **Language** | TypeScript |
| **Database/Auth** | Supabase |
| **AI SDK** | Puter.js |
| **Styling** | Tailwind CSS / shadcn/ui |
| **Animations** | Lenis (Smooth Scroll) / Framer Motion |
| **Email** | Nodemailer (SMTP) |

## ⚙️ Local Setup

### Prerequisites
- Node.js 18.x or higher
- A Supabase Project (URL and Anon Key)
- SMTP Credentials (for contact/invites)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/risvandev/TilawaNow.git
   cd TilawaNow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory, copy the contents from `.env.example`, and paste your actual credentials:
   ```bash
   cp .env.example .env
   ```

### 🗄️ Database Setup (Required)

TilawaNow relies on a structured Supabase database for authentication, performance auditing, and persistence. The application will not function correctly without initializing the schema.

#### What it configures:
- **User Authentication**: Custom profile management linked to Supabase Auth.
- **Audit System**: Real-time tracking of unique Ayahs read and streaks.
- **Reading Progress**: Session-based activity tracking for analytics.
- **Security**: Row Level Security (RLS) policies to ensure data privacy.

#### Setup Instructions:

1.  Open your **Supabase Dashboard**.
2.  Navigate to the **SQL Editor** in the left sidebar.
3.  Click **New Query**.
4.  Copy the entire contents of `database_setup.sql` from this repository.
5.  Paste into the editor and click **Run**.

#### Key Tables Created:
- `profiles` → Core user data.
- `reading_sessions` → High-level session tracking.
- `reading_activity` → Granular, ayah-level interaction data.

> Row Level Security (RLS) is enabled by default in the script. Failure to run this will result in `403 Forbidden` or `Empty Result` errors across the application.

#### Advanced Features Setup:
If you plan to use the Leaderboard feature, you will also need to run its setup script in the Supabase SQL Editor:
- **Leaderboard**: Run the `scripts/setup_leaderboard.sql` file. This creates a secure RPC function to safely rank users without exposing personal data.

### 📧 SMTP Setup (Optional)
This is required specifically for the **Contact Form** and **Invite** features. (Note: Supabase Auth emails are managed separately in the Supabase Dashboard).

To enable these features, configure your SMTP provider (e.g., Resend, Mailtrap) in your `.env` file:
- **Sender Details**: Set `SMTP_FROM_EMAIL` and `SMTP_FROM_NAME`.
- **Provider Settings**: Fill in `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS`.

### 4. Run Development Server
```bash
npm run dev
```

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL v3)**.

> [!IMPORTANT]
> **Mandatory Disclosure**: If you modify and deploy this software publicly (even as a web service), you **must** make your source code available under the same license. See the [LICENSE](LICENSE) file for details.

## 🔭 Vision

The goal of TilawaNow is **depth without distraction**. By bridging classical scholarship with modern AI, we aim to provide tools that help users not just read the Quran, but analyze and retain its message with technical precision and spiritual focus.

## ✍️ Author

**Muhammed Risvan**
- GitHub: [@risvandev](https://github.com/risvandev)
- Website: [tilawanow.vercel.app](https://tilawanow.vercel.app)

---

<p align="center">
  <em>Built for the Ummah. Always Open. Always Free.</em>
</p>
