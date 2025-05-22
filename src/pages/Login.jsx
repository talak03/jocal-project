import React, { useState } from "react";
import "../styles/Login.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [isSignUpActive, setIsSignUpActive] = useState(false);
  const [loginError, setLoginError] = useState("");
 const [registerError, setregisterError] = useState("");
  const navigate = useNavigate();
  const containerClass = isSignUpActive ? "login-container right-panel-active" : "login-container";

  const handleToggle = () => setIsSignUpActive(!isSignUpActive);

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
     setLoginError("");
      navigate("/"); 

    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
    
     if (message === "Invalid email or password") {
      setLoginError("Invalid email or password");
    } else {
      setLoginError("Something went wrong. Please try again.");
    }
    console.error("Login error:", error);
  }
};

  const handleRegister = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        username,
        email,
        password,
      });

      setregisterError("");
      setIsSignUpActive(false);

    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      
     
     if (message === "Email already registered") {
      setregisterError("User already exists");
      
    } else {
      setregisterError("Something went wrong. Please try again.");
    }
    console.error("register error:", error);
  }
};

  return (

    //REGISTER
    <div className="login-wrapper">
      <div className={containerClass}>
        <div className="form-container sign-up-container">
          <form onSubmit={handleRegister}>
            <h1>Create Account</h1>
            {/* <div className="social-container"> */}
              {/* <a href="#" className="social"><i className="fab fa-facebook-f"></i></a> */}
              {/* <a href="#" className="social"><i className="fab fa-google-plus-g"></i></a> */}
            {/* </div> */}
            {/* <span>or use your email for registration</span> */}
                {registerError && <p className="register-error">{registerError}</p>}
            <input type="text" name="username" placeholder="Name" required />
            <input type="email" name="email" placeholder="Email" required />
            <input type="password" name="password" placeholder="Password" required />
            <button type="submit">Sign Up</button>
          </form>
        </div>



           {/* LOGIN */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleLogin}>
            <h1>Sign in</h1>
           {/* <div className="social-container"> */}
           {/* <a href="#" className="social"><i className="fab fa-facebook-f"></i></a> */}
           {/* <a href="#" className="social"><i className="fab fa-google-plus-g"></i></a> */}
              {/* <a href="#" className="social"><i className="fab fa-linkedin-in"></i></a> */}
            {/* </div> */}
            <span>or use your account</span>
            <input type="email" name="email" placeholder="Email" required />
            <input type="password" name="password" placeholder="Password" required />
            {loginError && <p className="login-error">{loginError}</p>}
            <a href="#">Forgot your password?</a>
            <button type="submit">Sign In</button>
          </form>
        </div>

        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome to Jocal!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button className="ghost" onClick={handleToggle}>Sign In</button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start journey with us</p>
              <button className="ghost" onClick={handleToggle}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
