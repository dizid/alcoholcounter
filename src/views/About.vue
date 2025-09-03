<template>
  <!-- Main container for the About page, using global .container class for consistency -->
  <div class="container">
    <!-- Page title and content -->
    <h1>About</h1>
    <p>Hi, I am Marc from Rotterdam</p>
    <p>Because I drink too much I made this app. I hope it will benefit you too &#x1F64F;</p>
    <p>Good luck, have fun.</p>

    <!-- Container for the logo, placed below the text -->
    <div class="logo-container">
      <!-- Logo image with responsive styling -->
      <!-- Replace 'logo-happy-face.jpg' with the exact filename from src/assets/ (e.g., cheerful-logo.png) -->
      <img src="@/assets/logo.png" alt="Cheerful Alcohol Support Tracker Logo" class="logo-image" />
    </div>

  <div>
    <p></p>
  <h2>Privacy Policy</h2>
  <p>
Your privacy is important to us. We will never share your information with anyone. We only use your data to improve your experience. By using our service, you agree to this simple policy.
If you have any questions, feel free to contact us. </p>
  </div>
  </div>
</template>

<script setup>
  // No dynamic logic needed for this static page.
  // If interactivity is added later (e.g., logo animation), import Vue features here.
</script>