<template>
  <main>
    <div class="text-center mt-4">
      <h2>
        Challenge Februar
      </h2>
      <div class="container">
        <div v-for="challenge in challengeList" :key="challenge.id" class="card mb-2">
          <div class="card-header">
            {{ challenge.name }}
          </div>
          <div class="card-body">
            <!-- gesamt zähler -->
            noch {{ challenge.restCount }} von {{ challenge.count }} (noch {{ challenge.nochTage }} Tage)
            <div
              class="progress"
              role="progressbar"
              aria-label="Success striped example"
              aria-valuenow="25"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="progress-bar progress-bar-striped bg-primary"
                :style="{ width: (challenge.countDone / challenge.count) * 100 + '%' }"
              ></div>
            </div>
            <!-- tages zähler -->
            <div v-if="challenge.restTagesCount > 0">
              Heute noch {{ challenge.restTagesCount }} von {{ challenge.tagesCount }}
            </div>
            <div v-else>
              {{ challenge.countDatumHeute }} von {{ challenge.tagesCount }}
            </div>
            <div
              class="progress"
              role="progressbar"
              aria-label="Success striped example"
              aria-valuenow="25"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="progress-bar progress-bar-striped bg-primary" :class="{ 'bg-success': challenge.restTagesCount <= 0 }"
                :style="{ width: (challenge.countDatumHeute / challenge.tagesCount) * 100 + '%' }"
              ></div>
            </div>
            <div>
              <div class="input-group mt-2">
                <label class="input-group-text">Anzahl</label>
                <input
                  :disabled="disableButtons"
                  type="number"
                  class="form-control"
                  v-model="challenge.countInput"
                >
                <button
                  :disabled="disableButtons"
                  class="btn btn-primary"
                  @click="clickSave(challenge)"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </main>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';

const challenges = reactive([]);
const userStore = useUserStore();
const disableButtons = ref(false);

const sendCounter = async (counterObj) => {
  let response;

  try {
    response = await fetch(`/api/setCount`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(counterObj)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error:', result.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Neuen Zähler speichern
const clickSave = async (challengeData) => {
  disableButtons.value = true;
  let countDone = 0;
  let datumHeute = challengeData.datumHeute;
  let countDatumHeute = challengeData.countDatumHeute + parseInt(challengeData.countInput)

  console.log(' datumHeute', datumHeute);

  for (const challenge of challenges) {
    if (challenge.id === challengeData.id) {
      challenge.countDone += parseInt(challengeData.countInput);
      countDone = challenge.countDone;
      challenge.countDatumHeute += parseInt(challengeData.countInput);
    }
  }

  await sendCounter({ userId: userStore.user.id, challengeId: challengeData.id, count: countDone, countDatumHeute, datumHeute });
  disableButtons.value = false;
}

// Berechnete ChallengeList
const challengeList = computed(() => {
  const list = [];

  for (const challenge of challenges) {
    if (challenge.countDone === undefined) {
      challenge.countDone = 0;
    }

    // Anzahl Tage bis zum Ende der Challenge
    const nochTage = Math.ceil((new Date(challenge.endDatum) - new Date()) / (1000 * 60 * 60 * 24));
    // Anzahl Übungen pro tag
    let tagesCount = (challenge.count - challenge.countDone + challenge.countDatumHeute) / nochTage;

    // Aufrunden
    tagesCount = Math.ceil(tagesCount);

    list.push({
      id: challenge.id,
      name: challenge.name,
      startDatum: challenge.startDatum,
      endDatum: challenge.endDatum,
      countDatumHeute: challenge.countDatumHeute,
      datumHeute: challenge.datumHeute,
      nochTage,
      tagesCount,
      restTagesCount: tagesCount - challenge.countDatumHeute,
      count: challenge.count,
      countDone: challenge.countDone,
      restCount: challenge.count - challenge.countDone || challenge.count
    });
  }
  return list;
});

const getChallenges = async () => {
  let response;

  try {
    response = await fetch(`/api/getChallenges/${userStore.user.id}`, {
      method: 'GET',
      credentials: 'include'  // Cookies mitsenden
    });

    const result = await response.json();
    console.log('getChallenges result', result);

    if (response.ok) {
      challenges.splice(0);

      for (const challange of result.list) {
        challenges.push(challange);
      }
    } else {
      console.error('Error:', result.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

onMounted(async () => {
  getChallenges();
});
</script>

<style scoped>
.center-image {
  display: block;
  margin-left: auto;
  margin-right: auto;
  max-width: 80%;
}
</style>