document.addEventListener('DOMContentLoaded', () => {
  const passwordInput = document.getElementById('password');
  const leftArm = document.getElementById('left-arm');
  const eyes = document.getElementById('eyes');

  // Interactivity for the "Creative Login Page" character
  
  // When the user focuses on the password field, the boy covers his eyes!
  passwordInput.addEventListener('focus', () => {
      // Modify the SVG path to move the arm up to the face
      leftArm.setAttribute('d', 'M 30 45 Q 20 25 35 22');
      
      // Hide the open eyes so it looks like the arm is fully covering them
      eyes.style.opacity = '0';
  });

  // When the user clicks away (blurs), the boy puts his arm back down
  passwordInput.addEventListener('blur', () => {
      // Reset arm position
      leftArm.setAttribute('d', 'M 30 45 L 18 65');
      
      // Show eyes again
      eyes.style.opacity = '1';
  });
  
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const forgotPwdForm = document.getElementById('forgotPwdForm');
  const showRegister = document.getElementById('showRegister');
  const showLogin = document.getElementById('showLogin');
  const showForgotPwd = document.getElementById('showForgotPwd');
  const showLoginFromReset = document.getElementById('showLoginFromReset');
  const formTitle = document.getElementById('formTitle');
  const formSubtitle = document.getElementById('formSubtitle');

  // Toggle Forms
  showRegister.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.style.display = 'none';
      forgotPwdForm.style.display = 'none';
      registerForm.style.display = 'block';
      formTitle.innerText = 'Create Account';
      formSubtitle.innerText = 'Sign up to get started';
  });

  showLogin.addEventListener('click', (e) => {
      e.preventDefault();
      registerForm.style.display = 'none';
      forgotPwdForm.style.display = 'none';
      loginForm.style.display = 'block';
      formTitle.innerText = 'Welcome back';
      formSubtitle.innerText = 'Sign in to continue';
  });

  showLoginFromReset.addEventListener('click', (e) => {
      e.preventDefault();
      registerForm.style.display = 'none';
      forgotPwdForm.style.display = 'none';
      loginForm.style.display = 'block';
      formTitle.innerText = 'Welcome back';
      formSubtitle.innerText = 'Sign in to continue';
  });

  showForgotPwd.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.style.display = 'none';
      registerForm.style.display = 'none';
      forgotPwdForm.style.display = 'block';
      formTitle.innerText = 'Reset Password';
      formSubtitle.innerText = 'Enter details to reset';
  });

  // Handle Login
  loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById('username').value;
      const passwordInput = document.getElementById('password').value;
      const errorDiv = document.getElementById('loginError');
      
      try {
          const res = await fetch('http://localhost:3000/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: usernameInput, password: passwordInput })
          });
          
          const data = await res.json();
          if (res.ok) {
              localStorage.setItem('userRole', data.role);
              if (data.assigned_units) {
                  localStorage.setItem('assignedUnits', data.assigned_units);
              } else {
                  localStorage.removeItem('assignedUnits');
              }
              if (data.role === 'admin') {
                  window.location.href = '/admin_dashboard.html';
              } else if (data.role === 'editor') {
                  window.location.href = '/excel-dashboard/dashboard.html';
              } else {
                  window.location.href = '/excel-dashboard/dashboard.html';
              }
          } else {
              errorDiv.innerText = data.error || 'Login failed';
          }
      } catch (err) {
          errorDiv.innerText = 'Server error';
      }
  });

  // Handle Register
  registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById('reg-username').value;
      const passwordInput = document.getElementById('reg-password').value;
      const errorDiv = document.getElementById('registerError');
      const successDiv = document.getElementById('registerSuccess');
      
      errorDiv.innerText = '';
      successDiv.innerText = '';
      
      try {
          const res = await fetch('http://localhost:3000/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: usernameInput, password: passwordInput })
          });
          
          const data = await res.json();
          if (res.ok) {
              successDiv.innerText = 'Registration successful! You can now log in.';
              document.getElementById('reg-username').value = '';
              document.getElementById('reg-password').value = '';
              setTimeout(() => {
                  showLogin.click();
              }, 1500);
          } else {
              errorDiv.innerText = data.error || 'Registration failed';
          }
      } catch (err) {
          errorDiv.innerText = 'Server error';
      }
  });

  // Handle Reset Password
  forgotPwdForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById('reset-username').value;
      const newPasswordInput = document.getElementById('reset-password').value;
      const errorDiv = document.getElementById('resetError');
      const successDiv = document.getElementById('resetSuccess');
      
      errorDiv.innerText = '';
      successDiv.innerText = '';
      
      try {
          const res = await fetch('http://localhost:3000/api/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: usernameInput, newPassword: newPasswordInput })
          });
          
          const data = await res.json();
          if (res.ok) {
              successDiv.innerText = 'Password reset successful!';
              document.getElementById('reset-username').value = '';
              document.getElementById('reset-password').value = '';
              setTimeout(() => {
                  showLoginFromReset.click();
              }, 1500);
          } else {
              errorDiv.innerText = data.error || 'Reset failed';
          }
      } catch (err) {
          errorDiv.innerText = 'Server error';
      }
  });
});
