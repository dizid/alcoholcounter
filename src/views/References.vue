<template>
  <!-- Main container for the References page, using global .container class for consistency -->
  <div class="container">
    <!-- Page title with semantic heading -->
    <h1>Scientific References on Alcohol Tracking Effectiveness</h1>
    
    <!-- Introductory paragraph explaining the purpose -->
    <p>
      Below is a curated list of scientific studies and trials providing evidence that tracking alcohol consumption (e.g., via apps or self-monitoring) can help reduce drinking and improve health outcomes. These references are based on randomized controlled trials and peer-reviewed research.
    </p>
    
    <!-- Responsive HTML table displaying references -->
    <table class="references-table" aria-label="Scientific References Table">
      <!-- Table header row -->
      <thead>
        <tr>
          <th>Reference Description</th>
          <th>URL</th>
        </tr>
      </thead>
      
      <!-- Table body with reference rows -->
      <tbody>
        <!-- Reference 1: Digital intervention trial -->
        <tr>
          <td>
            Randomized controlled trial showing that a digital alcohol intervention with weekly self-monitoring and feedback significantly reduced total weekly alcohol consumption and heavy episodic drinking compared to basic alcohol information.
          </td>
          <td>
            <a href="https://bmcmedicine.biomedcentral.com/articles/10.1186/s12916-022-02374-5" target="_blank" rel="noopener noreferrer">View Study</a>
          </td>
        </tr>
        
        <!-- Reference 2: Smartphone app RCT -->
        <tr>
          <td>
            RCT demonstrating that a full smartphone app for tracking alcohol reduced typical weekly consumption more than an educational-only version, with supportive evidence for reducing unhealthy drinking.
          </td>
          <td>
            <a href="https://www.sciencedirect.com/science/article/pii/S221478292400040X" target="_blank" rel="noopener noreferrer">View Study</a>
          </td>
        </tr>
        
        <!-- Reference 3: Drink Less app effectiveness -->
        <tr>
          <td>
            Randomized trial of the Drink Less app, where sensitivity analysis showed a greater reduction in weekly alcohol units compared to standard NHS advice, highlighting the role of tracking in behavior change.
          </td>
          <td>
            <a href="https://www.sciencedirect.com/science/article/pii/S2589537024001135" target="_blank" rel="noopener noreferrer">View Study</a>
          </td>
        </tr>
        
        <!-- Reference 4: Drinkaware app mixed-methods study -->
        <tr>
          <td>
            Mixed-methods evaluation of the Drinkaware app, finding that self-monitoring led to reduced alcohol consumption, especially in the first week, among motivated high-risk drinkers.
          </td>
          <td>
            <a href="https://bmcpublichealth.biomedcentral.com/articles/10.1186/s12889-017-4358-9" target="_blank" rel="noopener noreferrer">View Study</a>
          </td>
        </tr>
        
        <!-- Reference 5: Patient perceptions of tracking apps -->
        <tr>
          <td>
            Qualitative study on patient perceptions, showing that self-monitoring alcohol apps help assess, track, and control consumption, improving communication with clinicians and supporting behavior change.
          </td>
          <td>
            <a href="https://www.tandfonline.com/doi/full/10.1080/10826084.2023.2269578" target="_blank" rel="noopener noreferrer">View Study</a>
          </td>
        </tr>
        
        <!-- Reference 6: Development of Drink Less app (PMC) -->
        <tr>
          <td>
            Paper on the development of the Drink Less app, citing self-monitoring as an effective behavior change technique in alcohol interventions, supported by evidence from prior studies.
          </td>
          <td>
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6417151/" target="_blank" rel="noopener noreferrer">View Study</a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
  // No dynamic logic needed for this static page.
  // If you add interactivity (e.g., sorting table), import necessary Vue features here.
  // For example: import { ref } from 'vue';
</script>