<template>
  <div class="auth-container">
    <form class="auth-form" @submit.prevent="handleLogin">
      <h2>Welcome Back</h2>

      <input v-model="email" type="email" placeholder="Email Address" required />
      <input v-model="password" type="password" placeholder="Password" required />

      <button type="submit" class="btn-primary">Login</button>

      <p class="switch">
        Don’t have an account?
        <a href="#" @click.prevent="emit('navigate', 'signup')">Sign Up</a>
      </p>
      <button type="button" class="btn-google" @click="loginWithGoogle">
          <i class="fab fa-google google-multi"></i>
        Continue with Google
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { login } from "../services/auth";
import { toast } from "vue3-toastify";

const emit = defineEmits(["navigate"]);

const email = ref("");
const password = ref("");

const handleLogin = async () => {
  try {
    const response = await login(email.value, password.value);

    localStorage.setItem("authToken", response.token);
    localStorage.setItem("user", JSON.stringify({
      name: response.name || "User",
      email: response.email || email.value,
    }));

    localStorage.setItem("currentView", "doctors");
    toast.success("Login successful!");
    emit("navigate", "doctors");
  } catch (err) {
    console.error(err.response?.data || err);
    toast.error("Login failed. Please check your credentials.");
  }
};
const loginWithGoogle = () => {
  localStorage.removeItem("authToken");
  window.location.href = "https://dashboard.evomations.com/auth/google";
};


</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background: var(--bg);
  position: fixed;
  top: 0;
  left: 0;
}
.google-multi {
  font-size: 22px;
  background: conic-gradient(
    #4285F4 0deg 90deg,
    #34A853 90deg 180deg,
    #FBBC05 180deg 270deg,
    #EA4335 270deg 360deg
  );
  -webkit-background-clip: text;
  color: transparent;
}
.auth-form {
  width: 100%;
  max-width: 380px;
  background: var(--panel-solid, #fff);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: var(--shadow-2, 0 10px 40px rgba(0,0,0,0.1));
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.auth-form h2 {
  text-align: center;
  margin-bottom: 10px;
  font-size: 1.6rem;
  color: var(--text);
}

.auth-form input {
  padding: 12px;
  border: 1px solid var(--border, #ddd);
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
}

.auth-form input:focus {
  border-color: var(--brand, #2563eb);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.btn-primary {
  background: linear-gradient(135deg, var(--brand, #2563eb), var(--brand-2, #1a73e8));
  color: #fff;
  padding: 12px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  filter: brightness(1.05);
  transform: translateY(-1px);
}

.switch {
  text-align: center;
  font-size: 0.9rem;
  color: var(--muted, #64748b);
}

.switch a {
  color: var(--brand, #2563eb);
  font-weight: 600;
  text-decoration: none;
}
.switch a:hover {
  text-decoration: underline;
}
.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #dadce0;
  background: #fff;
  color: #444;
  font-weight: 500;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  margin-top: 10px;
}

.btn-google:hover {
  background: #f7f8f8;
  transform: translateY(-1px);
}

.btn-google img {
  width: 20px;
  height: 20px;
}

@media (max-width: 480px) {
  .auth-form {
    padding: 1.5rem;
    margin: 16px;
    box-shadow: none;
  }
  .auth-form h2 {
    font-size: 1.4rem;
  }
}
</style>
