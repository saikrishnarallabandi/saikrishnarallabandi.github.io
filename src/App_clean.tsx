import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [publicationFilter, setPublicationFilter] = useState('All');
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const publications = [
    { title: 'A survey of code-switched speech and language processing', authors: 'S Sitaram, KR Chandu, SK Rallabandi, AW Black', year: 2019, citations: 153, category: 'Code-Switching' },
    { title: 'Experiments with Cross-lingual Systems for Synthesis of Code-Mixed Text.', authors: 'S Sitaram, SK Rallabandi, S Rijhwani, AW Black', year: 2016, citations: 43, category: 'Code-Switching' },
    { title: 'Unsupervised self-training for sentiment analysis of code-switched data', authors: 'A Gupta, S Menghani, SK Rallabandi, AW Black', year: 2021, citations: 26, category: 'Code-Switching' },
    { title: 'On Building Mixed Lingual Speech Synthesis Systems.', authors: 'SK Rallabandi, AW Black', year: 2017, citations: 26, category: 'Speech Synthesis' },
    { title: 'Speech Synthesis for Mixed-Language Navigation Instructions.', authors: 'KR Chandu, SK Rallabandi, S Sitaram, AW Black', year: 2017, citations: 26, category: 'Code-Switching' },
    { title: 'Acoustics based intent recognition using discovered phonetic units for low resource languages', authors: 'A Gupta, X Li, SK Rallabandi, AW Black', year: 2021, citations: 19, category: 'NLP/Dialog Systems' },
    { title: 'Ner4Opt: Named Entity Recognition for Optimization Modelling from Natural Language', authors: 'PP Dakle, S Kadıoğlu, K Uppuluri, R Politi, P Raghavan, SK Rallabandi, ...', year: 2023, citations: 14, category: 'Other' },
    { title: 'Automatic detection of code-switching style from acoustics', authors: 'SK Rallabandi, S Sitaram, AW Black', year: 2018, citations: 13, category: 'Code-Switching' },
    { title: 'Ordinal Triplet Loss: Investigating Sleepiness Detection from Speech', authors: 'ENAB Peter Wu, SaiKrishna Rallabandi', year: 2019, citations: 12, category: 'Speech Processing' },
    { title: 'Unconscious self-training for sentiment analysis of code-linked data', authors: 'A Gupta, S Menghani, SK Rallabandi, AW Black', year: 2021, citations: 8, category: 'NLP/Dialog Systems' },
    { title: 'A resource for computational experiments on mapudungun', authors: 'M Duan, C Fasola, SK Rallabandi, RM Vega, A Anastasopoulos, L Levin, ...', year: 2019, citations: 8, category: 'Other' },
    { title: 'A survey of code switching speech and language processing', authors: 'S Sitaram, KR Chandu, SK Rallabandi, AW Black', year: 2019, citations: 8, category: 'Speech Processing' },
    { title: 'Heysquad: A spoken question answering dataset', authors: 'Y Wu, SK Rallabandi, R Srinivasamurthy, PP Dakle, A Gon, P Raghavan', year: 2023, citations: 7, category: 'Other' },
    { title: 'Understanding BLOOM: An empirical study on diverse NLP tasks', authors: 'PP Dakle, SK Rallabandi, P Raghavan', year: 2022, citations: 7, category: 'Deep Learning' },
    { title: 'Task-specific pre-training and cross lingual transfer for code-switched data', authors: 'A Gupta, SK Rallabandi, A Black', year: 2021, citations: 7, category: 'Code-Switching' },
    { title: 'Developing a unit selection voice given audio without corresponding text', authors: 'T Godambe, SK Rallabandi, SV Gangashetty, A Alkhairy, A Jafri', year: 2016, citations: 7, category: 'Speech Synthesis' },
    { title: 'Disentangling speech and non-speech components for building robust acoustic models from found data', authors: 'N Gurunath, SK Rallabandi, A Black', year: 2019, citations: 6, category: 'Representation Learning' },
    { title: 'IIIT-H\'s entry to Blizzard Challenge 2015', authors: 'SK Rallabandi, A Vadapalli, S Achanta, SV Gangashetty', year: 2015, citations: 6, category: 'Speech Synthesis' },
    { title: 'Significance of paralinguistic cues in the synthesis of mathematical equations', authors: 'V Potluri, SK Rallabandi, P Srivastava, K Prahallad', year: 2014, citations: 6, category: 'Other' },
    { title: 'Intent recognition and unsupervised slot identification for low-resourced spoken dialog systems', authors: 'A Gupta, O Deng, A Kushwaha, S Mittal, W Zeng, SK Rallabandi, ...', year: 2021, citations: 5, category: 'NLP/Dialog Systems' },
    { title: 'Switch Point biased Self-Training: Re-purposing Pretrained Models for Code-Switching', authors: 'P Chopra, SK Rallabandi, AW Black, KR Chandu', year: 2021, citations: 5, category: 'Code-Switching' },
    { title: 'On detecting code mixing in speech using discrete latent representations', authors: 'SK Rallabandi, AW Black', year: 2020, citations: 5, category: 'Representation Learning' },
    { title: 'Learning disentangled representation in latent stochastic models: A case study with image captioning', authors: 'N Vyas, SK Rallabandi, L Morishetti, E Hovy, AW Black', year: 2019, citations: 5, category: 'Representation Learning' },
    { title: 'Investigating Utterance Level Representations for Detecting Intent from Acoustics.', authors: 'SK Rallabandi, B Karki, C Viegas, E Nyberg, AW Black', year: 2018, citations: 5, category: 'Representation Learning' },
    { title: 'Intent Classification Using Pre-trained Language Agnostic Embeddings For Low Resource Languages', authors: 'H Yadav, A Gupta, SK Rallabandi, AW Black, RR Shah', year: 2021, citations: 4, category: 'NLP/Dialog Systems' },
    { title: 'Submission from CMU for blizzard challenge 2019', authors: 'SK Rallabandi, P Wu, AW Black', year: 2019, citations: 4, category: 'Speech Synthesis' },
    { title: 'IIIT Hyderabad\'s submission to the Blizzard Challenge 2015', authors: 'SK Rallabandi, A Vadapalli, S Achanta, SV Gangashetty', year: 2015, citations: 4, category: 'Speech Synthesis' },
    { title: 'Ner4Opt: named entity recognition for optimization modelling from natural language', authors: 'S Kadıoğlu, P Pravin Dakle, K Uppuluri, R Politi, P Raghavan, ...', year: 2024, citations: 3, category: 'Other' },
    { title: 'Self-training strategies for sentiment analysis: An empirical study', authors: 'H Liu, SK Rallabandi, Y Wu, PP Dakle, P Raghavan', year: 2023, citations: 3, category: 'NLP/Dialog Systems' },
    { title: 'Jetsons at the FinNLP-2022 ERAI Task: BERT-Chinese for mining high MPP posts', authors: 'A Gon, S Zha, SK Rallabandi, PP Dakle, P Raghavan', year: 2022, citations: 3, category: 'Deep Learning' },
    { title: 'Towards leveraging llms for conditional qa', authors: 'SA Hussain, PP Dakle, SK Rallabandi, P Raghavan', year: 2023, citations: 2, category: 'Deep Learning' },
    { title: 'Sonority rise: Aiding backoff in syllable-based speech synthesis', authors: 'S Rallabandi, A Pandey, S Rallabandi, T Godambe, SV Gangashetty', year: 2016, citations: 2, category: 'Speech Synthesis' },
    { title: 'Using transformer-based models for taxonomy enrichment and sentence classification', authors: 'PP Dakle, S Patil, SK Rallabandi, C Hegde, P Raghavan', year: 2022, citations: 1, category: 'NLP/Dialog Systems' },
    { title: 'The CMU entry to blizzard machine learning challenge', authors: 'P Baljekar, SK Rallabandi, AW Black', year: 2017, citations: 1, category: 'Speech Synthesis' },
    { title: 'IIIT Hyderabad\'s entry to Blizzard Challenge 2016', authors: 'SS Rallabandi, SK Rallabandi, SV Gangashetty', year: 2016, citations: 1, category: 'Speech Synthesis' },
    { title: 'De-Entanglement: A Framework towards building Ubiquitous speech technologies', authors: 'SK Rallabandi', year: 2022, citations: 0, category: 'Representation Learning' },
    { title: 'On Controlled DeEntanglement for Natural Language Processing', authors: 'SK Rallabandi', year: 2019, citations: 0, category: 'Other' },
    { title: 'Building Scalable and Unrestricted Text to Speech Systems for Indian Languages', authors: 'SK Rallabandi', year: 2018, citations: 0, category: 'Speech Processing' },
    { title: 'The CMU System for Blizzard Challenge 2017', authors: 'SK Rallabandi, P Baljekar, AW Black', year: 2017, citations: 0, category: 'Speech Synthesis' },
    { title: 'On Controlled De Entanglement', authors: 'SK Rallabandi', year: 2020, citations: 0, category: 'Other' },
    { title: 'Unsupervised Self-Training for Unsupervised Cross-Lingual Transfer', authors: 'A Gupta, S Menghani, SK Rallabandi, AW Black', year: 2020, citations: 0, category: 'Code-Switching' },
    { title: '11-785: ASR for Indian Languages', authors: 'L Morishetti, P Geetha, SK Rallabandi', year: 2020, citations: 0, category: 'Other' },
    { title: 'On Controlled De Entanglement for Language Technologies', authors: 'SK Rallabandi', year: 2020, citations: 0, category: 'Other' },
    { title: 'Improving Compositionality in Deep Module Networks for Visual Question Answering', authors: 'B Karki, L Morishetti, N Vyas, SK Rallabandi', year: 2020, citations: 0, category: 'Other' },
    { title: 'Research Collaborations: Academic Year 2019-20', authors: 'SK Rallabandi', year: 2020, citations: 0, category: 'Other' },
    { title: 'VQVAE FOR SPEECH PROCESSING', authors: 'SK Rallabandi, AW Black', year: 2020, citations: 0, category: 'Speech Processing' },
    { title: 'Joint Modeling of Electronic Health Records and Clinical Notes', authors: 'C Nagpal, SK Rallabandi', year: 2020, citations: 0, category: 'Other' },
    { title: 'Submission from CMU towards 1st MultiTarget Speaker Detection and Identification Challenge', authors: 'SK Rallabandi, AW Black', year: 2020, citations: 0, category: 'Other' }
  ];

  const chartData = {
    labels: publications.map(p => p.title.length > 30 ? p.title.substring(0, 27) + '...' : p.title),
    datasets: [{
      label: 'Citations',
      data: publications.map(p => p.citations),
      backgroundColor: 'rgba(165, 105, 189, 0.7)',
      borderColor: 'rgba(165, 105, 189, 1)',
      borderWidth: 1
    }]
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: function(context: Array<{ dataIndex: number }>) {
            return publications[context[0].dataIndex].title;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Citations'
        }
      }
    }
  };

  const filteredPublications = publicationFilter === 'All' 
    ? publications 
    : publications.filter(pub => pub.category === publicationFilter);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="antialiased" style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#fdfcfb', color: '#333333' }}>
      <style>{`
        .nav-link {
          position: relative;
          transition: color 0.3s ease-in-out;
          font-weight: 500;
        }
        .nav-link:hover {
          color: #8B5CF6;
        }
        .nav-link.active {
          color: #8B5CF6;
        }
        .nav-link.active::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 2px;
          bottom: -4px;
          left: 0;
          background-color: #8B5CF6;
          border-radius: 2px;
        }
        .card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
        }
        .section-title {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-align: center;
        }
      `}</style>

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-lg border-b border-gray-200/50 shadow-sm' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Sai Krishna Rallabandi
            </h1>
            <div className="flex space-x-6 text-sm">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'publications', label: 'Publications' },
                { id: 'research', label: 'Research' },
                { id: 'experience', label: 'Experience' }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`nav-link transition-colors ${
                    activeTab === tab.id ? 'active text-purple-600' : 'hover:text-purple-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <>
            <section className="pt-24 pb-12 text-center">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Senior Data Scientist & AI Research Leader
                </h1>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="card p-4 text-center">
                    <div className="text-3xl font-bold text-purple-700">510+</div>
                    <div className="text-sm text-gray-600">Citations</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className="text-3xl font-bold text-blue-700">61</div>
                    <div className="text-sm text-gray-600">Publications</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className="text-3xl font-bold text-green-700">H-12</div>
                    <div className="text-sm text-gray-600">Index</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className="text-3xl font-bold text-red-700">$2B+</div>
                    <div className="text-sm text-gray-600">AI-Guided Assets</div>
                  </div>
                </div>

                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Carnegie Mellon Ph.D. (Language Technologies) • Facebook Fellowship 2020 • 510+ Citations Across 61 Publications
                  <br />
                  <span className="font-semibold text-purple-700">
                    Pioneering explainable AI frameworks that bridge foundational research with critical industry applications at Fidelity Investments
                  </span>
                </p>
                
                <div className="flex justify-center space-x-4 text-sm">
                  <p className="flex items-center gap-2 text-gray-600">
                    <i className="fas fa-map-marker-alt text-purple-600"></i> 
                    Location: Boston, MA
                  </p>
                  <p className="flex items-center gap-2 text-gray-600">
                    <i className="fas fa-briefcase text-purple-600"></i> 
                    Work: Fidelity Investments
                  </p>
                </div>
              </div>
            </section>

            <section className="py-12">
              <div className="max-w-6xl mx-auto">
                <h2 className="section-title text-2xl font-bold mb-6">About Me</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="card p-6">
                    <h3 className="text-xl font-semibold mb-4 text-purple-700">Professional Journey</h3>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      As a Senior Data Scientist at Fidelity Investments, I bridge cutting-edge AI research with real-world financial applications. 
                      My journey began with a Ph.D. in Language Technologies from Carnegie Mellon University, where I was honored with the prestigious 
                      Facebook Fellowship in 2020.
                    </p>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      My research portfolio spans 61 publications with 510+ citations, focusing on foundational challenges in multilingual AI, 
                      code-switching, and explainable artificial intelligence. The centerpiece of my work is the De-Entanglement framework—a novel 
                      approach to building more interpretable and controllable AI systems.
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      At Fidelity, I've successfully translated academic innovations into practical solutions, developing AI systems that manage over 
                      $2 billion in assets and creating conversational interfaces that have reduced operational costs by 40%.
                    </p>
                  </div>
                  
                  <div className="card p-6">
                    <h3 className="text-xl font-semibold mb-4 text-blue-700">Research Philosophy</h3>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      I believe artificial intelligence should be not just powerful, but understandable, controllable, and beneficial to society. 
                      My research in De-Entanglement addresses fundamental questions about how AI systems can be made more transparent and 
                      interpretable while maintaining their effectiveness.
                    </p>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      Through work on code-switching and multilingual technologies, I strive to make AI accessible to diverse linguistic communities, 
                      breaking down barriers that prevent billions of people from benefiting from advances in artificial intelligence.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">8.4</div>
                        <div className="text-xs text-gray-500">Avg Citations/Paper</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">91.96%</div>
                        <div className="text-xs text-gray-500">Non-Self Citations</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'publications' && (
          <section className="pt-24 pb-12">
            <div className="max-w-6xl mx-auto">
              <h2 className="section-title text-2xl font-bold mb-6">Research Portfolio & Publications</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="card p-4 text-center">
                  <div className="text-3xl font-bold text-purple-700">61</div>
                  <div className="text-sm text-gray-600">Total Publications</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-3xl font-bold text-blue-700">510</div>
                  <div className="text-sm text-gray-600">Total Citations</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-3xl font-bold text-green-700">12</div>
                  <div className="text-sm text-gray-600">H-Index</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-3xl font-bold text-red-700">8.4</div>
                  <div className="text-sm text-gray-600">Avg Citations/Paper</div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                My research spans foundational AI frameworks, multilingual speech technologies, and practical financial applications. 
                With 510+ citations across 61 publications, my work addresses critical challenges in explainable AI, code-switching, 
                and cross-lingual processing.
              </p>
            
              <div className="mb-6 flex flex-wrap gap-2">
                {['All', 'Code-Switching', 'Speech Synthesis', 'Speech Processing', 'NLP/Dialog Systems', 'Representation Learning', 'Deep Learning', 'Other'].map((filter) => (
                  <button 
                    key={filter}
                    onClick={() => setPublicationFilter(filter)}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      publicationFilter === filter 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-purple-100'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {filteredPublications.slice(0, 15).map((pub, idx) => (
                  <div key={idx} className="card p-4">
                    <h4 className="font-semibold text-sm mb-2 text-gray-800 leading-tight">{pub.title}</h4>
                    <p className="text-xs text-gray-600 mb-2">{pub.authors}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-purple-600 font-medium">{pub.year}</span>
                      <span className="text-xs text-blue-600 font-medium">{pub.citations} citations</span>
                    </div>
                    <div className="mt-2">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">{pub.category}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <h3 className="text-xl font-bold mb-4 text-center text-purple-800">Citation Impact by Publication</h3>
                <div className="bg-white rounded-2xl shadow-lg p-4" style={{ height: '400px' }}>
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'research' && (
          <section className="pt-24 pb-12">
            <div className="max-w-6xl mx-auto">
              <h2 className="section-title text-2xl font-bold mb-6">Research Impact & Innovation</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card p-6">
                  <h3 className="text-lg font-semibold mb-3 text-purple-700">De-Entanglement Framework</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Novel AI framework for building interpretable and controllable neural networks, advancing explainable AI research 
                    with applications in finance and healthcare.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Explainable AI</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Neural Networks</span>
                  </div>
                </div>
                
                <div className="card p-6">
                  <h3 className="text-lg font-semibold mb-3 text-blue-700">Multilingual Speech Systems</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Advanced text-to-speech and speech processing systems supporting code-switching and low-resource languages, 
                    serving millions of users across 13 Indian languages.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">TTS</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">Code-Switching</span>
                  </div>
                </div>
                
                <div className="card p-6">
                  <h3 className="text-lg font-semibold mb-3 text-green-700">Financial AI at Fidelity</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Production AI systems managing $2B+ in assets and reducing operational costs by 40%. 
                    Real-world impact serving millions of retail investors.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">FinTech</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">NLP</span>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4 text-center text-purple-700">National & Economic Impact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🇺🇸</div>
                    <h4 className="font-semibold text-gray-800 mb-2">National Security</h4>
                    <p className="text-sm text-gray-600">
                      De-Entanglement framework advances U.S. leadership in explainable AI for defense applications
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-4xl mb-2">💰</div>
                    <h4 className="font-semibold text-gray-800 mb-2">Economic Value</h4>
                    <p className="text-sm text-gray-600">
                      $2B+ in AI-guided assets and 40% cost reduction through intelligent automation
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-4xl mb-2">🌍</div>
                    <h4 className="font-semibold text-gray-800 mb-2">Global Access</h4>
                    <p className="text-sm text-gray-600">
                      Multilingual technologies serving millions and bridging linguistic divides
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'experience' && (
          <section className="pt-24 pb-12">
            <div className="max-w-6xl mx-auto">
              <h2 className="section-title text-2xl font-bold mb-6">Professional Experience</h2>
              
              <div className="space-y-8">
                <div className="card p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Senior Data Scientist</h3>
                      <p className="text-purple-600 font-medium">Fidelity Investments</p>
                    </div>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">2022 - Present</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Leading AI innovation in financial services, managing $2B+ in assets through advanced AI systems.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Key Achievements:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Developed InvestBot managing $2B+ in assets</li>
                        <li>• Created Advanced HelpDesk Bot (40% cost reduction)</li>
                        <li>• Led AI strategy for retail investment platforms</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Technologies:</h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Python</span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">TensorFlow</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">AWS</span>
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">FinTech</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Ph.D. in Language Technologies</h3>
                      <p className="text-purple-600 font-medium">Carnegie Mellon University</p>
                    </div>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">2018 - 2022</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Facebook Fellowship recipient with 510+ citations across 61 publications in AI, NLP, and speech processing.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Research Focus:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• De-Entanglement Framework</li>
                        <li>• Code-Switching in Speech</li>
                        <li>• Multilingual TTS Systems</li>
                        <li>• Explainable AI</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Recognition:</h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Facebook Fellowship</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">510+ Citations</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">H-Index: 12</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-gray-800 text-white mt-16">
        <div className="container mx-auto px-8 py-10 text-center">
          <p>&copy; 2024 Sai Krishna Rallabandi. All rights reserved.</p>
          <p className="text-sm text-gray-400 mt-3">
            This interactive profile was generated to summarize and visualize key professional achievements.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
