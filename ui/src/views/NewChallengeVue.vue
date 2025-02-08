<template>
  <div class="container mt-5">
    <h2>Neue Challenge</h2>
    <form @submit.prevent="submitForm">
      <div class="mb-3">
        <label for="name" class="form-label">Name</label>
        <input
          type="text"
          id="name"
          v-model="form.name"
          class="form-control"
          required
        />
      </div>

      <div class="mb-3">
        <label for="count" class="form-label">Anzahl Übungen pro User</label>
        <input
          type="number"
          id="count"
          v-model="form.count"
          class="form-control"
          required
        />
      </div>

      <div class="mb-3">
        <label for="startDatum" class="form-label">Startdatum</label>
        <input
          type="date"
          id="startDatum"
          v-model="form.startDatum"
          class="form-control"
          required
        />
      </div>

      <div class="mb-3">
        <label for="endDatum" class="form-label">Enddatum</label>
        <input
          type="date"
          id="endDatum"
          v-model="form.endDatum"
          class="form-control"
          required
        />
      </div>

      <button type="submit" :disabled="disabledSubmit" class="btn btn-primary">Challenge anlegen</button>

      <div class="m-2 text-danger" v-if="errorMessage">{{ errorMessage }}</div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const form = ref({
  name: '',
  count: '',
  startDatum: '',
  endDatum: '',
});

const router = useRouter();
const errorMessage = ref('');
const submitted = ref(false);

const disabledSubmit = computed(() => {
  return form.value.name === '' || form.value.count === '' || form.value.startDatum === '' || form.value.endDatum === '';
});

const submitForm = async () => {
  submitted.value = true;

  try {
    const response = await fetch('/api/addChallenge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: form.value.name,
        count: form.value.count,
        startDatum: form.value.startDatum,
        endDatum: form.value.endDatum
      }),
      credentials: 'include'
    });

    const result = await response.json();

    if (response.ok) {
      errorMessage.value = '';
      router.push('/');
    } else {
      errorMessage.value = result.message || 'Anlegen der Challenge fehlgeschlagen';
    }
  } catch (error) {
    console.error('Es gab ein Problem mit dem Anlegen der Challenge:', error);
    errorMessage.value = 'Es gab ein Problem mit dem Anlegen der Challenge. Bitte versuche es erneut.';
  }
};
</script>

<style>
</style>