
<template>
  <div class="page-container">
    <h1>Feedback</h1>
    <p>Please take a moment to provide your valuable feedback.</p>
    <iframe
      src="https://docs.google.com/forms/d/e/1FAIpQLSdV7RcpkD9VX4KneUSDuoOAAY65bLrBzU9XpwrpWw_bGh6xsQ/viewform?embedded=true"
      frameborder="0"
      marginheight="0"
      marginwidth="0"
      width="100%"
      height="600px"
      allowfullscreen
    ></iframe>
  </div>
</template>

<script>
export default {
  name: 'FeedbackPage',
};
</script>

<style scoped>
.page-container {
  padding: 20px;
  text-align: center;
}

iframe {
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
}
</style>

