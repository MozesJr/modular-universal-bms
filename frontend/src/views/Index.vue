<template>
  <div>
    <index-navbar />
    <section
      class="header relative pt-16 items-center flex h-screen max-h-860-px"
    >
      <div class="container mx-auto items-center flex flex-wrap">
        <div class="w-full md:w-8/12 lg:w-6/12 xl:w-6/12 px-4">
          <div class="pt-32 sm:pt-0">
            <h2 class="font-semibold text-4xl text-blueGray-600">
              Capstone Project &middot; Universitas Gadjah Mada &middot; DIKE 2026
            </h2>
            <p class="mt-4 text-lg leading-relaxed text-blueGray-500">
              Real-time individual cell monitoring dashboard for lithium battery
              packs. Powered by ESP32 over MQTT, streamed live via Socket.io,
              and stored in MongoDB.
            </p>
            <div class="mt-12">
              <router-link
                to="/auth/login"
                class="get-started text-white font-bold px-6 py-4 rounded outline-none focus:outline-none mr-1 mb-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 uppercase text-sm shadow hover:shadow-lg ease-linear transition-all duration-150"
              >
                Login to Dashboard
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <img
        class="absolute top-0 b-auto right-0 pt-16 sm:w-6/12 -mt-48 sm:mt-0 w-10/12 max-h-860-px"
        :src="patternVue"
        alt="..."
      />
    </section>

    <section class="mt-48 md:mt-40 pb-40 relative bg-blueGray-100">
      <div
        class="-mt-20 top-0 bottom-auto left-0 right-0 w-full absolute h-20"
        style="transform: translateZ(0);"
      >
        <svg
          class="absolute bottom-0 overflow-hidden"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          version="1.1"
          viewBox="0 0 2560 100"
          x="0"
          y="0"
        >
          <polygon
            class="text-blueGray-100 fill-current"
            points="2560 0 2560 100 0 100"
          ></polygon>
        </svg>
      </div>
      <div class="container mx-auto">
        <div class="flex flex-wrap items-center">
          <div
            class="w-10/12 md:w-6/12 lg:w-4/12 px-12 md:px-4 mr-auto ml-auto -mt-32"
          >
            <div
              class="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded-lg bg-emerald-500"
            >
              <img
                alt="..."
                src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=700&q=80"
                class="w-full align-middle rounded-t-lg"
              />
              <blockquote class="relative p-8 mb-4">
                <svg
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 583 95"
                  class="absolute left-0 w-full block h-95-px -top-94-px"
                >
                  <polygon
                    points="-30,95 583,95 583,65"
                    class="text-emerald-500 fill-current"
                  ></polygon>
                </svg>
                <h4 class="text-xl font-bold text-white">
                  Built for the Capstone DIKE 2026
                </h4>
                <p class="text-md font-light mt-2 text-white">
                  Monitor every individual cell in your battery pack in real
                  time. The modular architecture supports multiple packs, each
                  with configurable chemistry, voltage limits, and thermal
                  thresholds.
                </p>
              </blockquote>
            </div>
          </div>

          <div class="w-full md:w-6/12 px-4">
            <div class="flex flex-wrap">
              <div class="w-full md:w-6/12 px-4">
                <div class="relative flex flex-col mt-4">
                  <div class="px-4 py-5 flex-auto">
                    <div
                      class="text-blueGray-500 p-3 text-center inline-flex items-center justify-center w-12 h-12 mb-5 shadow-lg rounded-full bg-white"
                    >
                      <i class="fas fa-bolt"></i>
                    </div>
                    <h6 class="text-xl mb-1 font-semibold">
                      Real-Time Data
                    </h6>
                    <p class="mb-4 text-blueGray-500">
                      Voltage, current, temperature, and SoC streamed live
                      from ESP32 nodes over MQTT and Socket.io.
                    </p>
                  </div>
                </div>
                <div class="relative flex flex-col min-w-0">
                  <div class="px-4 py-5 flex-auto">
                    <div
                      class="text-blueGray-500 p-3 text-center inline-flex items-center justify-center w-12 h-12 mb-5 shadow-lg rounded-full bg-white"
                    >
                      <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h6 class="text-xl mb-1 font-semibold">
                      Threshold Alerts
                    </h6>
                    <p class="mb-4 text-blueGray-500">
                      Automatic detection of over-voltage, over-temperature,
                      and low SoC conditions with a live alert feed.
                    </p>
                  </div>
                </div>
              </div>
              <div class="w-full md:w-6/12 px-4">
                <div class="relative flex flex-col min-w-0 mt-4">
                  <div class="px-4 py-5 flex-auto">
                    <div
                      class="text-blueGray-500 p-3 text-center inline-flex items-center justify-center w-12 h-12 mb-5 shadow-lg rounded-full bg-white"
                    >
                      <i class="fas fa-layer-group"></i>
                    </div>
                    <h6 class="text-xl mb-1 font-semibold">Multi-Pack</h6>
                    <p class="mb-4 text-blueGray-500">
                      Configure and observe multiple battery packs
                      simultaneously, each with independent cell topologies.
                    </p>
                  </div>
                </div>
                <div class="relative flex flex-col min-w-0">
                  <div class="px-4 py-5 flex-auto">
                    <div
                      class="text-blueGray-500 p-3 text-center inline-flex items-center justify-center w-12 h-12 mb-5 shadow-lg rounded-full bg-white"
                    >
                      <i class="fas fa-database"></i>
                    </div>
                    <h6 class="text-xl mb-1 font-semibold">
                      Time-Series Storage
                    </h6>
                    <p class="mb-4 text-blueGray-500">
                      Full cell reading history persisted in MongoDB for
                      trend analysis and statistical queries.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="container mx-auto overflow-hidden pb-20">
        <div class="flex flex-wrap items-center">
          <div class="w-full md:w-4/12 px-12 md:px-4 ml-auto mr-auto mt-48">
            <div
              class="text-blueGray-500 p-3 text-center inline-flex items-center justify-center w-16 h-16 mb-6 shadow-lg rounded-full bg-white"
            >
              <i class="fas fa-microchip text-xl"></i>
            </div>
            <h3 class="text-3xl mb-2 font-semibold leading-normal">
              IoT Data Pipeline
            </h3>
            <p
              class="text-lg font-light leading-relaxed mt-4 mb-4 text-blueGray-600"
            >
              Every sensor reading from the ESP32 travels through Mosquitto,
              is processed by the Node.js backend, and pushed instantly to the
              dashboard via Socket.io — all with sub-second latency.
            </p>
            <div class="block pb-6">
              <span
                class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blueGray-500 bg-white uppercase last:mr-0 mr-2 mt-2"
              >
                ESP32
              </span>
              <span
                class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blueGray-500 bg-white uppercase last:mr-0 mr-2 mt-2"
              >
                MQTT
              </span>
              <span
                class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blueGray-500 bg-white uppercase last:mr-0 mr-2 mt-2"
              >
                Mosquitto
              </span>
              <span
                class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blueGray-500 bg-white uppercase last:mr-0 mr-2 mt-2"
              >
                Node.js
              </span>
              <span
                class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blueGray-500 bg-white uppercase last:mr-0 mr-2 mt-2"
              >
                Socket.io
              </span>
              <span
                class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blueGray-500 bg-white uppercase last:mr-0 mr-2 mt-2"
              >
                MongoDB
              </span>
              <span
                class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blueGray-500 bg-white uppercase last:mr-0 mr-2 mt-2"
              >
                Vue.js
              </span>
            </div>
          </div>

          <div class="w-full md:w-5/12 px-4 mr-auto ml-auto mt-32">
            <div
              class="relative flex flex-col min-w-0 w-full mb-6 mt-48 md:mt-0"
            >
              <img
                alt="..."
                :src="componentBtn"
                class="w-full align-middle rounded absolute shadow-lg max-w-100-px left-145-px -top-29-px z-3"
              />
              <img
                alt="..."
                :src="componentProfileCard"
                class="w-full align-middle rounded-lg absolute shadow-lg max-w-210-px left-260-px -top-160-px"
              />
              <img
                alt="..."
                :src="componentInfoCard"
                class="w-full align-middle rounded-lg absolute shadow-lg max-w-180-px left-40-px -top-225-px z-2"
              />
              <img
                alt="..."
                :src="componentInfo2"
                class="w-full align-middle rounded-lg absolute shadow-2xl max-w-200-px -left-50-px top-25-px"
              />
              <img
                alt="..."
                :src="componentMenu"
                class="w-full align-middle rounded absolute shadow-lg max-w-580-px -left-20-px top-210-px"
              />
              <img
                alt="..."
                :src="componentBtnPink"
                class="w-full align-middle rounded absolute shadow-xl max-w-120-px left-195-px top-95-px"
              />
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center pt-32">
          <div class="w-full md:w-6/12 px-4 mr-auto ml-auto mt-32">
            <div class="justify-center flex flex-wrap relative">
              <div class="my-4 w-full lg:w-6/12 px-4">
                <div class="bg-blueGray-800 shadow-lg rounded-lg text-center p-8">
                  <i class="fas fa-microchip text-white text-4xl mb-3 block"></i>
                  <p class="text-lg text-white mt-4 font-semibold">ESP32</p>
                </div>
                <div class="bg-orange-500 shadow-lg rounded-lg text-center p-8 mt-8">
                  <i class="fas fa-network-wired text-white text-4xl mb-3 block"></i>
                  <p class="text-lg text-white mt-4 font-semibold">Mosquitto MQTT</p>
                </div>
                <div class="bg-blueGray-700 shadow-lg rounded-lg text-center p-8 mt-8">
                  <i class="fab fa-node-js text-white text-4xl mb-3 block"></i>
                  <p class="text-lg text-white mt-4 font-semibold">Node.js</p>
                </div>
              </div>
              <div class="my-4 w-full lg:w-6/12 px-4 lg:mt-16">
                <div class="bg-emerald-600 shadow-lg rounded-lg text-center p-8">
                  <i class="fas fa-plug text-white text-4xl mb-3 block"></i>
                  <p class="text-lg text-white mt-4 font-semibold">Socket.io</p>
                </div>
                <div class="bg-green-700 shadow-lg rounded-lg text-center p-8 mt-8">
                  <i class="fas fa-leaf text-white text-4xl mb-3 block"></i>
                  <p class="text-lg text-white mt-4 font-semibold">MongoDB</p>
                </div>
                <div class="bg-emerald-500 shadow-lg rounded-lg text-center p-8 mt-8">
                  <i class="fab fa-vuejs text-white text-4xl mb-3 block"></i>
                  <p class="text-lg text-white mt-4 font-semibold">Vue.js</p>
                </div>
              </div>
            </div>
          </div>

          <div class="w-full md:w-4/12 px-12 md:px-4 ml-auto mr-auto mt-48">
            <div
              class="text-blueGray-500 p-3 text-center inline-flex items-center justify-center w-16 h-16 mb-6 shadow-lg rounded-full bg-white"
            >
              <i class="fas fa-drafting-compass text-xl"></i>
            </div>
            <h3 class="text-3xl mb-2 font-semibold leading-normal">
              Hybrid IoT Architecture
            </h3>
            <p
              class="text-lg font-light leading-relaxed mt-4 mb-4 text-blueGray-600"
            >
              The system bridges hardware sensor nodes and a web dashboard
              through a robust pub/sub MQTT backbone, giving you flexibility
              to add new packs or cell nodes without changing the backend.
            </p>
            <p
              class="text-lg font-light leading-relaxed mt-0 mb-4 text-blueGray-600"
            >
              Each layer is independently containerised via Docker Compose
              for easy deployment on any server.
            </p>
            <div class="block pb-6">
              <span
                class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blueGray-500 bg-white uppercase last:mr-0 mr-2 mt-2"
              >
                Docker
              </span>
              <span
                class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blueGray-500 bg-white uppercase last:mr-0 mr-2 mt-2"
              >
                REST API
              </span>
              <span
                class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blueGray-500 bg-white uppercase last:mr-0 mr-2 mt-2"
              >
                WebSocket
              </span>
              <span
                class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blueGray-500 bg-white uppercase last:mr-0 mr-2 mt-2"
              >
                Nginx
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="container mx-auto px-4 pb-32 pt-48">
        <div class="items-center flex flex-wrap">
          <div class="w-full md:w-5/12 ml-auto px-12 md:px-4">
            <div class="md:pr-12">
              <div
                class="text-blueGray-500 p-3 text-center inline-flex items-center justify-center w-16 h-16 mb-6 shadow-lg rounded-full bg-white"
              >
                <i class="fas fa-chart-line text-xl"></i>
              </div>
              <h3 class="text-3xl font-semibold">
                Live Dashboard & Alerts
              </h3>
              <p class="mt-4 text-lg leading-relaxed text-blueGray-500">
                The admin dashboard provides a live voltage time-series chart,
                per-cell SoC bar chart, a recent-alerts table, and an
                individual cell grid — all updating automatically as data
                arrives from the field.
              </p>
              <ul class="list-none mt-6">
                <li class="py-2">
                  <div class="flex items-center">
                    <div>
                      <span
                        class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blueGray-500 bg-blueGray-50 mr-3"
                      >
                        <i class="fas fa-bolt"></i>
                      </span>
                    </div>
                    <div>
                      <h4 class="text-blueGray-500">
                        Sub-second real-time cell readings
                      </h4>
                    </div>
                  </div>
                </li>
                <li class="py-2">
                  <div class="flex items-center">
                    <div>
                      <span
                        class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blueGray-500 bg-blueGray-50 mr-3"
                      >
                        <i class="fas fa-exclamation-triangle"></i>
                      </span>
                    </div>
                    <div>
                      <h4 class="text-blueGray-500">
                        Automatic threshold-violation alerts
                      </h4>
                    </div>
                  </div>
                </li>
                <li class="py-2">
                  <div class="flex items-center">
                    <div>
                      <span
                        class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blueGray-500 bg-blueGray-50 mr-3"
                      >
                        <i class="fas fa-database"></i>
                      </span>
                    </div>
                    <div>
                      <h4 class="text-blueGray-500">
                        Full history stored and queryable in MongoDB
                      </h4>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div class="w-full md:w-6/12 mr-auto px-4 pt-24 md:pt-0">
            <img
              alt="..."
              class="max-w-full rounded-lg shadow-xl"
              style="
                transform: scale(1) perspective(1040px) rotateY(-11deg)
                  rotateX(2deg) rotate(2deg);
              "
              :src="documentation"
            />
          </div>
        </div>
      </div>

      <div class="justify-center text-center flex flex-wrap mt-24">
        <div class="w-full md:w-6/12 px-12 md:px-4">
          <h2 class="font-semibold text-4xl">Modular Universal BMS</h2>
          <p class="text-lg leading-relaxed mt-4 mb-4 text-blueGray-500">
            A fully containerised, open IoT dashboard for lithium battery
            pack management. Built as a capstone project at Universitas
            Gadjah Mada for the DIKE 2026 programme.
          </p>
        </div>
      </div>
    </section>

    <section class="block relative z-1 bg-blueGray-600">
      <div class="container mx-auto">
        <div class="justify-center flex flex-wrap">
          <div class="w-full lg:w-12/12 px-4 -mt-24">
            <div class="flex flex-wrap">
              <div class="w-full lg:w-4/12 px-4">
                <h5 class="text-xl font-semibold pb-4 text-center">
                  Login Page
                </h5>
                <router-link to="/auth/login">
                  <div
                    class="hover:-mt-4 relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded-lg ease-linear transition-all duration-150"
                  >
                    <img
                      alt="..."
                      class="align-middle border-none max-w-full h-auto rounded-lg"
                      :src="login"
                    />
                  </div>
                </router-link>
              </div>

              <div class="w-full lg:w-4/12 px-4">
                <h5 class="text-xl font-semibold pb-4 text-center">
                  Live Monitor
                </h5>
                <router-link to="/auth/login">
                  <div
                    class="hover:-mt-4 relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded-lg ease-linear transition-all duration-150"
                  >
                    <img
                      alt="..."
                      class="align-middle border-none max-w-full h-auto rounded-lg"
                      :src="profile"
                    />
                  </div>
                </router-link>
              </div>

              <div class="w-full lg:w-4/12 px-4">
                <h5 class="text-xl font-semibold pb-4 text-center">
                  Alert Dashboard
                </h5>
                <router-link to="/auth/login">
                  <div
                    class="hover:-mt-4 relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded-lg ease-linear transition-all duration-150"
                  >
                    <img
                      alt="..."
                      class="align-middle border-none max-w-full h-auto rounded-lg"
                      :src="landing"
                    />
                  </div>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-20 bg-blueGray-600 overflow-hidden">
      <div class="container mx-auto pb-64">
        <div class="flex flex-wrap justify-center">
          <div class="w-full md:w-5/12 px-12 md:px-4 ml-auto mr-auto md:mt-64">
            <div
              class="text-blueGray-500 p-3 text-center inline-flex items-center justify-center w-16 h-16 mb-6 shadow-lg rounded-full bg-white"
            >
              <i class="fas fa-battery-full text-xl text-emerald-500"></i>
            </div>
            <h3 class="text-3xl mb-2 font-semibold leading-normal text-white">
              Open Source
            </h3>
            <p
              class="text-lg font-light leading-relaxed mt-4 mb-4 text-blueGray-400"
            >
              This project is open for academic review and extension by the
              DIKE 2026 cohort. Fork it, adapt it to your own battery chemistry
              and cell topology, and submit your contributions.
            </p>
            <p
              class="text-lg font-light leading-relaxed mt-0 mb-4 text-blueGray-400"
            >
              Ready to explore the live data? Log in to the dashboard now.
            </p>
            <router-link
              to="/auth/login"
              class="mt-4 inline-block text-white font-bold px-6 py-4 rounded outline-none focus:outline-none mr-1 mb-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 uppercase text-sm shadow hover:shadow-lg ease-linear transition-all duration-150"
            >
              <i class="fas fa-sign-in-alt mr-2"></i> Login to Dashboard
            </router-link>
          </div>

          <div class="w-full md:w-4/12 px-4 mr-auto ml-auto mt-32 relative">
            <i
              class="fas fa-battery-full text-blueGray-700 text-55 absolute -top-150-px -right-100 left-auto opacity-80"
            ></i>
          </div>
        </div>
      </div>
    </section>

    <section class="pb-16 bg-blueGray-200 relative pt-32">
      <div
        class="-mt-20 top-0 bottom-auto left-0 right-0 w-full absolute h-20"
        style="transform: translateZ(0);"
      >
        <svg
          class="absolute bottom-0 overflow-hidden"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          version="1.1"
          viewBox="0 0 2560 100"
          x="0"
          y="0"
        >
          <polygon
            class="text-blueGray-200 fill-current"
            points="2560 0 2560 100 0 100"
          ></polygon>
        </svg>
      </div>

      <div class="container mx-auto">
        <div
          class="flex flex-wrap justify-center bg-white shadow-xl rounded-lg -mt-64 py-16 px-12 relative z-10"
        >
          <div class="w-full text-center lg:w-8/12">
            <div class="text-blueGray-500 p-3 text-center inline-flex items-center justify-center w-16 h-16 mb-6 shadow-lg rounded-full bg-emerald-100">
              <i class="fas fa-battery-three-quarters text-emerald-600 text-2xl"></i>
            </div>
            <h3 class="font-semibold text-3xl">
              Ready to monitor your battery packs?
            </h3>
            <p class="text-blueGray-500 text-lg leading-relaxed mt-4 mb-4">
              Access the live dashboard to watch real-time cell metrics,
              review threshold alerts, and manage your pack configurations —
              all in one place.
            </p>
            <div class="sm:block flex flex-col mt-10">
              <router-link
                to="/auth/login"
                class="get-started text-white font-bold px-6 py-4 rounded outline-none focus:outline-none mr-1 mb-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 uppercase text-sm shadow hover:shadow-lg ease-linear transition-all duration-150"
              >
                <i class="fas fa-sign-in-alt mr-2"></i> Login to Dashboard
              </router-link>
            </div>
            <div class="text-center mt-16"></div>
          </div>
        </div>
      </div>
    </section>
    <footer-component />
  </div>
</template>

<script>
import IndexNavbar from "@/components/Navbars/IndexNavbar.vue";
import FooterComponent from "@/components/Footers/Footer.vue";

import patternVue from "@/assets/img/pattern_vue.png";
import componentBtn from "@/assets/img/component-btn.png";
import componentProfileCard from "@/assets/img/component-profile-card.png";
import componentInfoCard from "@/assets/img/component-info-card.png";
import componentInfo2 from "@/assets/img/component-info-2.png";
import componentMenu from "@/assets/img/component-menu.png";
import componentBtnPink from "@/assets/img/component-btn-pink.png";
import documentation from "@/assets/img/documentation.png";
import login from "@/assets/img/login.jpg";
import profile from "@/assets/img/profile.jpg";
import landing from "@/assets/img/landing.jpg";

export default {
  data() {
    return {
      patternVue,
      componentBtn,
      componentProfileCard,
      componentInfoCard,
      componentInfo2,
      componentMenu,
      componentBtnPink,
      documentation,
      login,
      profile,
      landing,
    };
  },
  components: {
    IndexNavbar,
    FooterComponent,
  },
};
</script>
