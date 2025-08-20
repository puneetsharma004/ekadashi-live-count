
import ChantForm from '../ChantForm';

const JapaSection = ({ user, eventSettings, userChantCount, globalCount, globalGoal, progressPercentage }) => {
  // ✅ SAFE: Handle undefined/null values with defaults
  const safeUserChantCount = userChantCount || 0;
  const safeGlobalCount = globalCount || 0;
  const safeGlobalGoal = globalGoal || 666;
  const safeProgressPercentage = progressPercentage || 0;
  
  // ✅ SAFE: Calculate contribution percentage with proper error handling
  const contributionPercentage = (safeGlobalGoal  > 0) 
    ? ((safeUserChantCount / safeGlobalGoal ) * 100).toFixed(1)
    : '0.0';
  
  // ✅ SAFE: Calculate holy names
  const holyNames = safeUserChantCount * 1728;

  // ✅ FIXED: Calculate actual progress percentage if not provided correctly
  const actualProgressPercentage = (safeGlobalGoal > 0) 
    ? Math.min((safeGlobalCount / safeGlobalGoal) * 100, 100)
    : 0;

  // Use the calculated progress if the passed one seems incorrect
  const displayProgressPercentage = (safeProgressPercentage > 0) ? safeProgressPercentage : actualProgressPercentage;

  return (
    <div className="space-y-6">
      {/* Personal Stats Header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gradient-saffron mb-2">
          📿 Your Japa Progress
        </h1>
        <p className="text-gray-300">
          Update and track your chanting rounds
        </p>
      </div>

      {/* User Personal Stats */}
      <div className="card-devotional text-center">
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          Your Chanted Rounds
        </h3>
        <div className="text-5xl font-bold text-saffron-400 glow-saffron mb-2">
          {safeUserChantCount}
        </div>
        <p className="text-gray-400 text-sm">rounds completed</p>
        
        {safeUserChantCount !== (user?.chantCount || 0) && (
          <p className="text-green-400 text-xs mt-2 animate-pulse">
            ✅ Updated in real-time
          </p>
        )}
      </div>

      {/* ✅ NEW: Contribution & Impact + Global Progress */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Your Contribution & Holy Names */}
        <div className="card-devotional text-center p-4">
          <div className="text-2xl font-bold text-devotional-gold mb-1">
            {contributionPercentage}%
          </div>
          <p className="text-gray-400 text-xs mb-3">Your Contribution</p>
          
          <div className="text-lg font-bold text-saffron-400">
            {holyNames.toLocaleString()}
          </div>
          <p className="text-gray-400 text-xs mt-1">Holy Names</p>
        </div>

        {/* Right: Global Progress with Border Progress Bar */}
        <div className="relative card-devotional text-center p-4 overflow-hidden">
          {/* ✅ SAFE: Progress Border Effect */}
          <div 
            className="absolute inset-0 rounded-lg border-4 border-transparent"
            style={{
              background: `conic-gradient(
                from 0deg,
                #f59e0b 0deg,
                #f59e0b ${Math.min((displayProgressPercentage  / 100) * 360, 360)}deg,
                transparent ${Math.min((displayProgressPercentage  / 100) * 360, 360)}deg,
                transparent 360deg
              )`,
              padding: '3px',
              borderRadius: '0.5rem'
            }}
          >
            <div className="w-full h-full bg-gray-800 rounded-lg"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            <div className="text-xl font-bold text-devotional-gold mb-1">
              {safeGlobalGoal}
            </div>
            <p className="text-gray-400 text-xs mb-2">Target Rounds</p>
            
            <div className="text-lg font-bold text-green-400">
              {safeGlobalCount}
            </div>
            <p className="text-gray-400 text-xs mt-1">Completed</p>
            
            {/* ✅ FIXED: Progress Percentage - Shows even when >100% */}
            <div className="mt-2">
              <span className={`text-xs font-bold ${displayProgressPercentage >= 100 ? 'text-green-400' : 'text-saffron-400'}`}>
                {displayProgressPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NEW: Event Completion Status */}
      {eventSettings?.status === 'completed' && (
        <div className="card-devotional bg-gradient-to-r from-green-900/20 to-green-800/10 border-green-500/30 text-center">
          <div className="mb-3">
            <span className="text-4xl">🏆</span>
          </div>
          <h3 className="text-lg font-semibold text-green-400 mb-2">
            Event Completed!
          </h3>
          <p className="text-gray-300 text-sm mb-2">
            Your contribution: <span className="font-bold text-devotional-gold">{contributionPercentage}%</span>
          </p>
          <p className="text-gray-400 text-xs">
            Total rounds achieved: {safeGlobalCount.toLocaleString()} / {safeGlobalGoal.toLocaleString()}
          </p>
        </div>
      )}

      {/* Chant Form */}
      {eventSettings?.eventActive === true && eventSettings?.status === 'active' ? (
        <div className="card-devotional">
          <h3 className="text-lg font-semibold text-gray-300 mb-4 text-center">
            Update Your Progress
          </h3>
          <ChantForm />
        </div>
      ) : (
        <div className="card-devotional text-center">
          <h3 className="text-lg font-semibold text-gray-400 mb-2">
            Chanting Updates Paused
          </h3>
          <p className="text-gray-400 text-sm">
            {eventSettings?.status === 'completed' 
              ? 'This event has been completed. Wait for the next event to continue chanting!'
              : eventSettings?.status === 'created'
              ? 'Event hasn\'t started yet. Updates will be available once the event begins.'
              : 'The event is currently paused. Updates will resume when the event is active.'}
          </p>
        </div>
      )}

      {/* Motivational Quotes */}
      <div className="card-devotional bg-gradient-to-r from-saffron-900/10 to-devotional-gold/5 border-saffron-500/20 text-center">
        <div className="mb-3">
          <span className="text-4xl">🙏</span>
        </div>
        <p className="text-gray-300 italic mb-2">
          "Chanting is the only means to cross the ocean of nescience in this Age of Kali."
        </p>
        <p className="text-saffron-400 text-sm font-semibold">
          — Sri Chaitanya Mahaprabhu
        </p>
      </div>
    </div>
  );
};

export default JapaSection;
