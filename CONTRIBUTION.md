

# 🤝 Contributing to ZenTrack

Thanks for your interest in improving ZenTrack!  
Here’s how you can help.

---

## 📌 How to Contribute

### 1. Fork & Clone
```bash
git fork https://github.com/Priyans00/zentrack.git
cd zentrack
````

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes

* Follow the **project’s coding style**
* Keep commits small and meaningful
* Write clear commit messages

### 4. Test Your Changes

Run:

```bash
npm run tauri dev
```

Ensure everything works before pushing.

### 5. Push & Create a Pull Request

```bash
git push origin feature/your-feature-name
```

Open a PR from your fork to the `main` branch.

---

## 💡 Development Tips

* **Frontend:** Located in the `src` folder (Next.js + TailwindCSS)
* **Backend:** Located in `src-tauri` (Rust + SQLite)
* **Config:**

  * Tauri settings → `src-tauri/tauri.conf.json`
  * Tailwind config → `tailwind.config.js`
* Run `npm run tauri dev` for live reload.

---

## 🛠 Code Style

* Use **Prettier** for formatting
* Use **ESLint** for linting
* Keep Rust code formatted via:

```bash
cargo fmt
```

---

## 📬 Need Help?

* Open a GitHub Issue
* Or start a discussion in the repo

---




