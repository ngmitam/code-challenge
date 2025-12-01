# Code Challenge Submission - Full-Stack Engineer

## Description

This repository contains my solutions to the 99Tech Code Challenge for the Full-Stack Engineer position. I've attempted problems 2, 4, 5, and 6 as per the requirements, demonstrating skills in both frontend and backend development.

## Table of Contents

-   [Problems](#problems)
-   [Solutions](#solutions)
-   [Technologies Used](#technologies-used)
-   [Setup and Installation](#setup-and-installation)
-   [How to Run](#how-to-run)
-   [Notes](#notes)

## Problems

The following problems were solved for the Full-Stack Engineer role:

-   [Problem 2: Fancy Form](src/problem2/problem.md) - Frontend currency swap form
-   [Problem 4: Three ways to sum to n](src/problem4/problem.md) - Backend TypeScript implementations
-   [Problem 5: A Crude Server](src/problem5/problem.md) - Backend CRUD server with Express and TypeScript
-   [Problem 6: Architecture](src/problem6/problem.md) - API service specification for scoreboard

## Solutions

### Problem 2: Fancy Form

**Location:** [src/problem2/](src/problem2/)

**Description:** A responsive currency swap form with validation, using modern frontend technologies.

**Key Features:**

-   Input validation and error messages
-   Intuitive UI/UX design
-   Integration with token icons and price API

### Problem 4: Three ways to sum to n

**Location:** [src/problem4/](src/problem4/)

**Description:** Three unique TypeScript implementations of a summation function with complexity analysis.

**Implementations:**

-   Iterative approach
-   Mathematical formula
-   Recursive method

### Problem 5: A Crude Server

**Location:** [src/problem5/](src/problem5/)

**Description:** A backend server with CRUD operations using Express.js and TypeScript, connected to a SQLite database.

**Features:**

-   RESTful API endpoints
-   Data persistence with SQLite
-   Basic filtering

### Problem 6: Architecture

**Location:** [src/problem6/](src/problem6/)

**Description:** Specification and documentation for an API service module handling live scoreboard updates.

**Deliverables:**

-   README with module documentation
-   Flow diagram
-   Improvement suggestions

## Technologies Used

-   **Frontend:** HTML, CSS, JavaScript, Vite (bonus)
-   **Backend:** Node.js, Express.js, TypeScript
-   **Database:** SQLite (for Problem 5)
-   **Tools:** Git, VS Code

## Setup and Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/ngmitam/code-challenge.git
    cd code-challenge
    ```

2. Install dependencies (if any):
    ```bash
    npm install
    # or yarn install
    ```

## How to Run

### Problem 2: Fancy Form

Navigate to `src/problem2/` and open `index.html` in a browser, or run with Vite if implemented.

### Problem 4: Three ways to sum to n

Run the TypeScript file:

```bash
npx ts-node src/problem4/solution.ts
```

### Problem 5: A Crude Server

Start the server:

```bash
cd src/problem5
npm start
```

Access at `http://localhost:3000`

### Problem 6: Architecture

Refer to the README.md in `src/problem6/` for the specification.

## Notes

-   All problems have been attempted with minimal viable solutions.
-   Assumptions are documented in each problem's solution.
-   For any uncertainties, I've noted them in the respective files.
