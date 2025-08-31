🚀 Getting Started
1. Clone the repo
git clone https://github.com/gazzimon/fhevm-react-template.git
cd fhevm-react-template

2. Install dependencies
pnpm install


Requires Node.js 18+ and pnpm

🛠️ Development Workflow
Step 1 – Start Hardhat node

Open a terminal:

cd packages/fhevm-hardhat-template
npx hardhat node


👉 Local blockchain at http://127.0.0.1:8545
 with test accounts.

Step 2 – Deploy contracts

In a second terminal:

cd packages/fhevm-hardhat-template
npx hardhat run scripts/deploy.ts --network localhost


👉 Compiles and deploys contracts. Copy the printed contract address.

Step 3 – Run the backend server

In a third terminal:

cd server
node index.js


👉 Starts the backend server that interacts with deployed contracts.

Step 4 – Run the frontend

In a fourth terminal:

cd packages/site
pnpm dev


👉 Starts the Next.js frontend at http://localhost:3000
.
👉 Make sure Hardhat node (Step 1) and backend server (Step 3) are running.

⚡ Typical Setup

Terminal 1 → Hardhat node

Terminal 2 → Deploy contracts

Terminal 3 → Backend server (/server/index.js)

Terminal 4 → Frontend (packages/site)

🐞 Troubleshooting

ESM error (Error HH19) → rename hardhat.config.js → hardhat.config.cjs.

MetaMask connection → add custom network:

RPC: http://127.0.0.1:8545

Chain ID: 31337

Ensure Hardhat node is running before deploying or starting server/frontend.

📖 Next Steps

Integrate SignatureRegistry contract with backend.

Expose REST/GraphQL endpoints in /server for signing & verifying.

Connect frontend with backend API.

Extend with Zama confidential contracts for privacy-preserving flows.