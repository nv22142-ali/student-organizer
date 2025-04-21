"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { FiList, FiClock, FiCalendar, FiBarChart2, 
  FiArrowRight, FiCpu, FiSmartphone, 
  FiFilter, FiCheckCircle } from "react-icons/fi";

export default function Home() {
  const features = [
    {
      icon: <FiCheckCircle className="h-6 w-6 text-primary" />,
      title: "Task Manager",
      description: "Easily create, organize, and complete tasks with our intuitive interface."
    },
    {
      icon: <FiClock className="h-6 w-6 text-primary" />,
      title: "Time Tracking",
      description: "Estimate and track the time spent on each task to improve productivity."
    },
    {
      icon: <FiCalendar className="h-6 w-6 text-primary" />,
      title: "Advanced Scheduling",
      description: "Set due dates, recurrence patterns, and reminders for your tasks."
    },
    {
      icon: <FiBarChart2 className="h-6 w-6 text-primary" />,
      title: "Progress Analytics",
      description: "Visualize your productivity and task completion rates with detailed insights."
    },
    {
      icon: <FiCpu className="h-6 w-6 text-blue-600" />,
      title: "AI-Powered Organization",
      description: "Leverage our AI capabilities to automatically categorize tasks, set priorities."
    },
    {
      icon: <FiSmartphone className="h-6 w-6 text-blue-600" />,
      title: "Mobile Access",
      description: "Access your tasks and manage your schedule on the go with our mobile-friendly design."
    },
    {
      icon: <FiFilter className="h-6 w-6 text-blue-600" />,
      title: "Filter",
      description: "Organize your tasks with customizable filters and labels for better visibility."
    },
    {
      icon: <FiCheckCircle className="h-6 w-6 text-blue-600" />,
      title: "Ease of Use",
      description: "Our user-friendly interface makes it easy to navigate and manage your tasks."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50">
      {/* Decorative background elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-primary/20 to-purple-400/20 blur-3xl"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 rounded-full bg-gradient-to-tr from-amber-400/20 to-emerald-400/20 blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/2 transform -translate-x-1/2 w-full h-96 rounded-full bg-gradient-to-r from-cyan-400/20 via-blue-400/10 to-indigo-400/20 blur-3xl"></div>
      </div>
      
      {/* Hero section */}
      <header className="container relative z-10 mx-auto px-4 py-6 md:py-8">
        <div className="flex justify-between items-center">
          <div className="font-bold text-2xl md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">Student Organizer</div>
          <div className="backdrop-blur-sm bg-white/30 rounded-full px-4 py-2 shadow-sm border border-white/50">
            <Button
              variant="ghost"
              className="mr-4 hidden md:inline-flex hover:bg-primary/10 hover:text-primary transition-colors"
              asChild
            >
              <Link href="#features">Features</Link>
            </Button>
            <Button 
              className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white shadow-md"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <section className="container relative z-10 mx-auto px-4 py-16 md:py-28 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-16 md:mb-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-lg"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-600 to-blue-600">
                Organize your student life
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-700 mb-10 leading-relaxed">
            A simple, powerful task manager designed specifically for students to boost productivity and stay organized throughout your academic journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white shadow-lg gap-2 border-0 rounded-full px-8 py-6 transition-all duration-300 hover:shadow-primary/30 hover:shadow-xl"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5">
                  <path fill="#fff" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                  <path fill="#fff" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2970142 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                  <path fill="#fff" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                  <path fill="#fff" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
                </svg>
                Sign in with Google
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2 rounded-full px-8 py-6 bg-white/60 backdrop-blur-sm border-white/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-300 shadow-md hover:shadow-lg"
                asChild
              >
                <Link href="#features">
                  Learn more
                  <FiArrowRight />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Task board animation */}
        <div className="md:w-1/2 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateX: 10, rotateY: -10 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            style={{ perspective: 1000 }}
            className="relative z-10"
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/70 shadow-2xl backdrop-blur-sm bg-white/70">
              <div className="bg-gradient-to-b from-white/90 to-white/60 p-6 pb-10">
                <div className="flex items-center mb-8">
                  <div className="h-3 w-3 rounded-full bg-red-400 mr-2"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-400 mr-2"></div>
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                  <div className="ml-4 text-sm font-medium text-slate-500">Task Dashboard</div>
                </div>
                
                {/* Task items */}
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 + i * 0.15, ease: "easeOut" }}
                    className={`bg-gradient-to-r ${
                      i === 0 ? 'from-blue-50 to-indigo-50' :
                      i === 1 ? 'from-green-50 to-emerald-50' :
                      i === 2 ? 'from-amber-50 to-yellow-50' :
                      'from-purple-50 to-fuchsia-50'
                    } rounded-xl p-4 mb-4 shadow-sm border border-white flex items-start hover:shadow-md transition-all duration-300 transform hover:-translate-y-1`}
                  >
                    <div className={`h-5 w-5 rounded-full border-2 mr-3 mt-0.5 flex-shrink-0 ${
                      i === 1 ? 'bg-primary border-primary' : 'border-slate-300'
                    }`}></div>
                    <div className="flex-1">
                      <div className={`h-4 ${
                        i === 0 ? 'bg-blue-200/70' : 
                        i === 1 ? 'bg-green-200/70' : 
                        i === 2 ? 'bg-amber-200/70' : 
                        'bg-purple-200/70'
                      } rounded-full w-4/5 mb-2`}></div>
                      <div className={`h-3 ${
                        i === 0 ? 'bg-blue-200/50' : 
                        i === 1 ? 'bg-green-200/50' : 
                        i === 2 ? 'bg-amber-200/50' : 
                        'bg-purple-200/50'
                      } rounded-full w-3/5`}></div>
                    </div>
                    <div className="ml-2 flex">
                      <div className={`h-5 w-14 ${
                        i === 0 ? 'bg-blue-200/70' : 
                        i === 1 ? 'bg-green-200/70' : 
                        i === 2 ? 'bg-amber-200/70' : 
                        'bg-purple-200/70'
                      } rounded-full`}></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features section */}
      <section id="features" className="py-28 bg-gradient-to-b from-blue-50 to-white relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <motion.h2 
              className="text-4xl md:text-5xl font-bold mb-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Features designed for <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-600 to-blue-600">students</span>
            </motion.h2>
            <motion.p 
              className="text-slate-700 max-w-2xl mx-auto text-lg"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Everything you need to stay on top of your academic responsibilities and boost your productivity.
            </motion.p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <div className="mb-6 bg-gradient-to-br from-primary/20 to-indigo-400/20 inline-flex items-center justify-center w-16 h-16 rounded-2xl">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="bg-gradient-to-r from-primary/5 via-indigo-500/10 to-blue-600/5 py-28 relative z-10">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-72 bg-gradient-to-r from-primary/20 via-transparent to-blue-600/20 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-900"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Ready to boost your productivity?
          </motion.h2>
          <motion.p 
            className="text-slate-700 max-w-2xl mx-auto mb-10 text-lg"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Join thousands of students who use Student Organizer to organize their academic lives and achieve their goals.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white shadow-lg gap-2 border-0 rounded-full px-8 py-6 transition-all duration-300 hover:shadow-primary/30 hover:shadow-xl"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5">
                <path fill="#fff" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                <path fill="#fff" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2970142 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                <path fill="#fff" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                <path fill="#fff" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
              </svg>
              Get Started with Google
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-slate-800 to-slate-900 text-slate-400 py-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <div className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300 mb-3">Student Organizer</div>
              <p className="text-sm text-slate-400">Helping students stay organized since 2025</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4 text-center md:text-left">Academic Links</h4>
              <ul className="space-y-3 flex flex-col items-center md:items-start">
                <li><Link href="https://moodle.ncst.edu.bh/" className="hover:text-white transition-colors" target="_blank">Moodle</Link></li>
                <li><Link href="https://sis.ncst.edu.bh/" className="hover:text-white transition-colors" target="_blank">Student Grades</Link></li>
                <li><Link href="https://outlook.office365.com/mail/" className="hover:text-white transition-colors" target="_blank">Outlook</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700/50 mt-12 pt-8 text-center text-sm">
            <p className="text-slate-500">© {new Date().getFullYear()} Student Organizer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
