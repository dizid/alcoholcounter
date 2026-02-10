
<template>
  <div class="feedback-page">
    <h1>Feedback</h1>
    <p>Please take a moment to provide your valuable feedback.</p>
    <div class="iframe-wrapper">
      <iframe
        src="https://docs.google.com/forms/d/e/1FAIpQLSdV7RcpkD9VX4KneUSDuoOAAY65bLrBzU9XpwrpWw_bGh6xsQ/viewform?embedded=true"
        frameborder="0"
        marginheight="0"
        marginwidth="0"
        allowfullscreen
      ></iframe>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FeedbackPage',
};
</script>

<style scoped>
.feedback-page {
  /* Break out of the #app max-width constraint */
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  padding: 1.5rem 1rem;
  text-align: center;
}

.feedback-page h1 {
  color: var(--info);
  font-size: 1.75rem;
  margin-bottom: 0.25rem;
}

.feedback-page p {
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.iframe-wrapper {
  max-width: 900px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.iframe-wrapper iframe {
  display: block;
  width: 100%;
  height: calc(100vh - 180px);
  min-height: 700px;
  border: none;
}
</style>
