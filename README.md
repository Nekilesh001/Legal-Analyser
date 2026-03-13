# Legal Contract Analyzer

A powerful, modern React-based application designed to streamline legal document review. This tool analyzes contract text, identifies potential risks, detects critical clauses, and provides actionable recommendations based on a built-in legal knowledge base.


## ✨ Key Features

- **Automated Contract Analysis**: Quickly analyze the content of any legal agreement.
- **Risk Assessment**: Get an overall risk score and detailed breakdowns of high, medium, and low-risk terms.
- **Clause Detection**: Automatically identify standard clauses such as Termination, Confidentiality, Liability, Payment, Intellectual Property, and Dispute Resolution.
- **Knowledge Base Integration**: Leverages a structured legal knowledge base to provide deeper insights into specific contract types.
- **Interactive Dashboard**: Visualize your analysis statistics and recent activity at a glance.
- **History & Reports**: Keep track of previous analyses and generate detailed reports.
- **Multi-language Support**: Designed with internationalization in mind.
- **Modern UI/UX**: Built with Tailwind CSS and Framer Motion for a fluid, premium experience.

## 🚀 Tech Stack

- **Frontend**: React 18, React Router 6
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Local Storage**: Dexie.js (IndexedDB wrapper for storing history)
- **Internationalization**: i18next

## 🛠️ Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Legal-Contract-Analyzer
   ```

2. **Navigate to the application folder**:
   ```bash
   cd react-legal-analyzer
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

The application should now be running at `http://localhost:3000`.

## 📂 Project Structure

- `src/components/`: UI components and page layouts (Dashboard, Analyzer, Results, etc.).
- `src/services/`: Core logic for legal analysis and knowledge base interactions.
- `src/contexts/`: React Contexts for state management (Analysis, Settings).
- `src/i18n/`: Internationalization configuration.

## ⚖️ License

This project is licensed under the MIT License - see the LICENSE file for details.

