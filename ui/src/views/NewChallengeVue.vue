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
        <label for="description" class="form-label">Challenge Typ</label>
        <select
          id="description"
          v-model="form.challengeType"
          class="form-select"
          required
        >
          <option value="1">Feste Übungsanzahl</option>
          <option value="2">Aufsteigende Übungsanzahl</option>
        </select>
      </div>

      <div v-if="form.challengeType === '1'" class="mb-3">
        <label for="count" class="form-label">Gesamtanzahl Übungen</label>
        <input
          type="number"
          id="count"
          v-model="form.count"
          class="form-control"
          required
        />
      </div>

      <template v-else-if="form.challengeType === '2'">
        <div class="mb-3">
          <label for="countBeginn" class="form-label">Anzahl Übungen am Anfang</label>
          <input
            type="number"
            id="countBeginn"
            v-model="form.countBeginn"
            class="form-control"
            required
          />
        </div>

        <div class="mb-3">
          <label for="countAdd" class="form-label">Anzahl Übungen erhöhen</label>
          <input
            type="number"
            id="countAdd"
            v-model="form.countAdd"
            class="form-control"
            required
          />
        </div>

        <div class="mb-3">
          <label for="countMultiplikator" class="form-label">Multiplikator der Steigerung</label>
          <input
            type="number"
            id="countMultiplikator"
            v-model="form.countMultiplikator"
            class="form-control"
            required
          />
        </div>

        <div class="mb-3">
          gesamt Count: {{ gesamtCount }}<br />
          letzer Übungs Anzahl: {{ lastCurrentCount }}
        </div>

      </template>

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
        <label for="endDatum" class="form-label">bis Enddatum (ohne diesen Tag)</label>
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
  challengeType: '1',
  countBeginn: 5,
  countAdd: 1,
  countMultiplikator: 1
});

const router = useRouter();
const errorMessage = ref('');
const submitted = ref(false);
let lastCurrentCount = ref(0);

const disabledSubmit = computed(() => {
  if (form.value.challengeType === '1') {
    return form.value.name === '' || form.value.count === '' || form.value.startDatum === '' || form.value.endDatum === '';
  }

  if (form.value.challengeType === '2') {
    return form.value.name === '' || form.value.startDatum === '' || form.value.endDatum === '' || form.value.countBeginn === '' || form.value.countAdd === '' || form.value.countMultiplikator === '';
  }

  return false;
});

const berGesamtCount = () => {
  const start = new Date(form.value.startDatum);
  const end = new Date(form.value.endDatum);
  let total = 0;
  let currentCount = form.value.countBeginn;
  let zaehler = 0;

  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {


    if (zaehler >= form.value.countMultiplikator) {
      currentCount += form.value.countAdd;
      zaehler = 0;
    }
    total += currentCount;
    zaehler++;
  }

  lastCurrentCount.value = currentCount;

  return total;
}

const gesamtCount = computed(() => {
  if (!form.value.startDatum || !form.value.endDatum) {
    return 0;
  }

  if (form.value.challengeType === '2') {
    return berGesamtCount();
  }
  return form.value.count;
});

const submitForm = async () => {
  submitted.value = true;

  if (form.value.challengeType === '2') {
    form.value.count = berGesamtCount();
  }

  console.warn('Formular wird gesendet:', form.value);

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
        endDatum: form.value.endDatum,
        challengeType: form.value.challengeType,
        countBeginn: form.value.countBeginn,
        countAdd: form.value.countAdd,
        countMultiplikator: form.value.countMultiplikator
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